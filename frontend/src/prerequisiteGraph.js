/**
 * Prerequisite Graph Builder
 * * This module parses the 'prerequisites_parsed' attribute from the 
 * all_courses_prereq.json file and constructs a Directed Graph.
 * * Data Format Reference:
 * - Simple: "ANT101H5"
 * - Complex: ["and", "ANT101H5", "BIO152H5"]
 * - Nested:  ["or", ["and", "A", "B"], "C"]
 */


import coursesData from './data/all_courses_prereq.json';

// Color codes for the Textbased output into the console
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

// Class to build the graph
class PrereqGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
    }

    // Build the graph
    build(data) {
        data.forEach(course => {
            this.addNode(course);
            if (course.prerequisites_parsed) {
                const dependencies = this.extractDependencies(course.prerequisites_parsed);
                dependencies.forEach(dep => {
                    this.addEdge(dep.code, course.code, dep.type);
                });
            }
        });
    }


    // Add a node to the graph
    addNode(course) {
        this.nodes.set(course.code, {
            name: course.name,
            description: course.description,
            logicTree: course.prerequisites_parsed
        });

        if (!this.edges.has(course.code)) {
            this.edges.set(course.code, []);
        }
    }

    // add an edge to the graph
    addEdge(fromNode, toNode, type) {
        if (!this.edges.has(fromNode)) {
            this.edges.set(fromNode, []);
        }
        
        const existingEdges = this.edges.get(fromNode);
        if (!existingEdges.some(e => e.code === toNode)) {
            existingEdges.push({ code: toNode, type: type });
        }
    }

    // Extract dependencies from the prerequisite node (recursive function) for the and or logic
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
        
        // Deduplicate
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

    // Get the typed requirements for a course
    getTypedRequirements(courseCode) {
        const node = this.nodes.get(courseCode);
        if (!node || !node.logicTree) return [];
        return this.extractDependencies(node.logicTree);
    }

    
}

const graph = new PrereqGraph();
graph.build(coursesData);


export default graph;