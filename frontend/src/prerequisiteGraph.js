/**
 * Prerequisite Graph Builder
 * * This module parses the 'prerequisites_parsed' attribute from the 
 * Supabase 'Courses' table and constructs a Directed Graph.
 * * Data Format Reference:
 * - Simple: "ANT101H5"
 * - Complex: ["and", "ANT101H5", "BIO152H5"]
 * - Nested:  ["or", ["and", "A", "B"], "C"]
 */

import supabase from './supabaseClient'; 

const CLR = {
    RESET: "\x1b[0m",
    BRIGHT: "\x1b[1m",
    DIM: "\x1b[2m",
    RED: "\x1b[31m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    CYAN: "\x1b[36m",
    WHITE: "\x1b[37m"
};

class PrereqGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.initialized = false; 
    }

    async initialize() {
        if (this.initialized) return;

        let allCourses = [];
        const pageSize = 1000;
        let from = 0;

        while (true) {
            const { data, error } = await supabase
                .from('Courses')
                .select('*')
                .range(from, from + pageSize - 1);

            if (error) throw error;
            allCourses = [...allCourses, ...data];
            if (data.length < pageSize) break;
            from += pageSize;
        }

        this.build(allCourses);
        this.initialized = true;
    }

    build(data) {
        data.forEach(course => {
            const courseCode = course.code || course.courseCode;
            let parsedPrereqs = course.prerequisites_parsed;

            // INSERTION: Safely parse Supabase data if it comes back as a stringified JSON array
            if (typeof parsedPrereqs === 'string') {
                try {
                    // Try to parse it (handles '["and", "A", "B"]')
                    parsedPrereqs = JSON.parse(parsedPrereqs);
                } catch (e) {
                    // If it fails to parse, it means it's likely a simple single string like "ANT101H5"
                    // We can safely leave it as a string.
                }
            }

            // MODIFICATION: Pass the safely parsed prereqs into addNode so the detail panel reads it correctly
            this.addNode({
                code: courseCode,
                name: course.name,
                description: course.description,
                prerequisites_parsed: parsedPrereqs 
            });

            // MODIFICATION: Extract dependencies using the safely parsed array
            if (parsedPrereqs) {
                const dependencies = this.extractDependencies(parsedPrereqs);
                dependencies.forEach(dep => {
                    this.addEdge(dep.code, courseCode, dep.type); 
                });
            }
        });
    }

    addNode(course) {
        this.nodes.set((course.code || course.courseCode), { 
            name: course.name,
            description: course.description,
            logicTree: course.prerequisites_parsed 
        });

        if (!this.edges.has((course.code || course.courseCode))) { 
            this.edges.set((course.code || course.courseCode), []);
        }
    }

    addEdge(fromNode, toNode, type) {
        if (!this.edges.has(fromNode)) {
            this.edges.set(fromNode, []);
        }
        
        const existingEdges = this.edges.get(fromNode);
        if (!existingEdges.some(e => e.code === toNode)) {
            existingEdges.push({ code: toNode, type: type });
        }
    }

    extractDependencies(prereqNode, parentType = 'AND') {
        let deps = [];
        if (!prereqNode) return deps;

        if (typeof prereqNode === 'string') {
            return [{ code: prereqNode.trim(), type: parentType }];
        }

        if (Array.isArray(prereqNode)) {
            const operator = prereqNode[0].toUpperCase();
            const operands = prereqNode.slice(1);
            operands.forEach(op => {
                deps = [...deps, ...this.extractDependencies(op, operator)];
            });
        }
        
        const uniqueDeps = [];
        const seen = new Set();
        deps.forEach(d => {
            if (!seen.has(d.code)) {
                seen.add(d.code);
                uniqueDeps.push(d);
            }
        });

        return uniqueDeps;
    }

    getTypedRequirements(courseCode) {
        const node = this.nodes.get(courseCode);
        if (!node || !node.logicTree) return [];
        return this.extractDependencies(node.logicTree);
    }
}

const graph = new PrereqGraph();

export default graph;