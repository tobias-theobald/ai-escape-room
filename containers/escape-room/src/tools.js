import { promisify } from 'node:util';
import child_process from 'node:child_process';
const exec = promisify(child_process.exec);

// Additional tools can be added here.
// Any tools should require the AI to give an explanation of why they are being run.
export const tools = {
    run_shell_command: {
        description: "Run a command in sh",
        parameters: {
            command: {
                type: "string",
                description: `The command to run, e.g. "ls -lR .", "cat src/query.js" or "echo 'import fs from "node:fs"' > src/run-tool.js"`,
            },
            explanation: {
                type: "string",
                description: "An explanation of why you are calling this command, e.g. 'I need to see the contents of the src/query.js file'."
            },
            timeout: {
                type: "number",
                description: "The time in seconds to wait before terminating the command"
            },
        },
        runner: async (parameters) => {
            const {command, timeout} = parameters;
            console.log(`Running command: ${command}`);
            try {
                const {stdout, stderr} = await exec(command, {timeout});
                return {
                    stdout,
                    stderr,
                };
            } catch (e) {
                return {
                    error: e.message,
                    code: e.code,
                    stdout: e.stdout,
                    stderr: e.stderr,
                };
            }
        }
    },
}

// Convert the tools to the format that the AI host expects
export const toolDefinitionsForAi = Object.entries(tools).map(([name, tool]) => ({
    type: "function",
    function: {
        name,
        description: tool.description,
        parameters: {
            type: "object",
            properties: tool.parameters,
            required: Object.keys(tool.parameters),
            additionalProperties: false,
        },
        strict: true,
    }
}));
