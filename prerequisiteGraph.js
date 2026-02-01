import { createClient } from '@supabase/supabase-js';
import jobPaths from './jobPaths.js';

const supabase = createClient(
        'https://lizixhskuaptkbgoituc.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpeml4aHNrdWFwdGtiZ29pdHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODk5NTksImV4cCI6MjA4NTQ2NTk1OX0.SSpx7bOByr7bx72SVWOykbX2BOTt2f0BejzuG_bRfl0'
        );

/**
 * Uses a list of courses to create a prerequisite graph for a career path
 *
 * Ticket 2 stuff (come back to this and remove and make good and shi)
 * @param {string} careerName - The name of the career path
 */
async function createPrerequisiteGraph(careerName) {
    // Get the list of courses for the career path
    const courses = jobPaths[careerName];

    // in the case that the career path doesn't exist - return an empty graph
    if (!courses) {
        return { nodes: [], edges: [] };
    }

    // create the graph
    visited = new Set();
    nodes = [];
    edges = [];

    // go through all the courses in the career path
    for (const course of courses) {
        await leafToTop(course, visited, nodes, edges);
    }

    return { nodes, edges };
}

/**
 * Recursively goes from a course node to the top of the graph (till no more prerequisites)
 * @param {*} course the coursecode to resolve
 */
async function leafToTop(course, visited, nodes, edges) {
    // if the course has already been visited, return
    if (visited.has(course)) {
        return;
    }

    // add the course to the visited set
    visited.add(course);

    // query the database for the course
    const { data: course, error } = await supabase.from('Courses').select('*').eq('Course Code', course).single();

    // if the course doesn't exist or there is an error, return
    if (error || !course) {
        return;
    }

    // add the course to the nodes array
    nodes.push({
        id: course.code,
        data: {
            label: course.code,
            title: course.name
        }
    });

    // match all the prerequisites to the format of a course code -- need to change this later (come back to this and make good and shi)
    let prerequisitesMatches;
    if (course.prerequisites) {
        prerequisitesMatches = course.prerequisites.match(/[A-Z]{3}\d{3}[A-Z]\d/g);
    } else {
        prerequisitesMatches = [];
    }

    // start the recurive poriton (get prerequisite prerequisites)
    if (prerequisitesMatches) {
        for (const prerequisite of prerequisitesMatches) {
            // add the edge from parent to the current course
            edges.push({
                id: `e-${prereq}-${courseCode}`,
                source: prerequisite,
                target: courseCode
            });

            // recurse
            await leafToTop(prerequisite, visited, nodes, edges);
            
        }
    }
    


}

export default getFullPathway;