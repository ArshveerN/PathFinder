/**
 * Prerequisite Graph Builder
 * * This module parses the 'prerequisites_parsed' attribute from the 
 * all_courses_prereq.json file and constructs a Directed Graph.
 * * Data Format Reference:
 * - Simple: "ANT101H5"
 * - Complex: ["and", "ANT101H5", "BIO152H5"]
 * - Nested:  ["or", ["and", "A", "B"], "C"]
 */

import coursesData from './Scraping Course Data/all_courses_prereq.json' with { type: "json" };
import jobPaths from './jobPaths.js';

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

    // =========================================================================
    /**
     * Helper: Returns a flat list of ALL requirements for a single course
     */
    getFlatRequirements(courseCode) {
        const node = this.nodes.get(courseCode);
        if (!node || !node.logicTree) return [];
        return this.extractDependencies(node.logicTree);
    }

    /**
     * PRETTY PRINTER
     * Uses colors and box-drawing characters for a professional look.
     */
    printCareerPathGraph(pathName, jobPathsObject) {
        const pathCourses = jobPathsObject[pathName];

        if (!pathCourses) {
            console.log(`${CLR.RED}Error: Career path "${pathName}" not found.${CLR.RESET}`);
            return;
        }

        console.log(`\n${CLR.CYAN}============================================${CLR.RESET}`);
        console.log(`${CLR.BRIGHT} 🚀 CAREER PATH MAP: ${pathName.toUpperCase()} ${CLR.RESET}`);
        console.log(`${CLR.CYAN}============================================${CLR.RESET}`);
        console.log(`${CLR.DIM} Legend: ${CLR.GREEN}● In Path${CLR.RESET} | ${CLR.RED}▲ External Requirement${CLR.RESET}`);
        console.log(`${CLR.DIM} Logic:  ${CLR.WHITE}(AND) = Mandatory${CLR.RESET} | ${CLR.YELLOW}(OR) = Optional/Choice${CLR.RESET}\n`);

        const sortedCourses = pathCourses.sort();

        sortedCourses.forEach(courseCode => {
            const requirements = this.getTypedRequirements(courseCode);
            
            // Header for the Course
            console.log(`${CLR.BRIGHT}${CLR.WHITE}📦 ${courseCode}${CLR.RESET}`);

            if (requirements.length === 0) {
                console.log(`   ${CLR.GREEN}└── No Prerequisites (Start Here!)${CLR.RESET}\n`);
                return;
            }

            // Print each requirement
            requirements.forEach((req, index) => {
                const isLast = index === requirements.length - 1;
                const prefix = isLast ? "└──" : "├──";
                
                const inPath = pathCourses.includes(req.code);
                
                // Determine Colors & Icons based on status
                let icon = "";
                let color = "";
                
                if (inPath) {
                    icon = "✅"; // or ●
                    color = CLR.GREEN;
                } else {
                    icon = "⚠️ "; // or ▲
                    color = CLR.RED;
                }

                // Format the Logic Type (AND/OR)
                let typeLabel = "";
                if (req.type === 'OR') typeLabel = `${CLR.YELLOW}(OR)${CLR.RESET}`;
                else typeLabel = `${CLR.DIM}(AND)${CLR.RESET}`;

                console.log(`   ${CLR.DIM}${prefix}${CLR.RESET} ${icon} ${color}${req.code}${CLR.RESET} ${typeLabel}`);
            });
            console.log(""); // Empty line for spacing
        });
    }
}

// Execution
const graph = new PrereqGraph();
graph.build(coursesData);
graph.printCareerPathGraph("Full Stack", jobPaths);



export default graph;