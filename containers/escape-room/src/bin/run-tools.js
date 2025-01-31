// This script runs the tools that the AI wants. It reads the current chat log, fetches the last message,
// and runs the tools that the AI wants. After running all the tools, it will write the updated chat log and restarts the query process.

import {readOrInitializeChatlog, writeChatlog} from "../chatlogAccessor.js";
import {tools} from "../tools.js";
import kexec from "@triggi/native-exec";

// Read the current chat log or initialize it. If this fails, the program is doomed anyway.
const currentChatLog = await readOrInitializeChatlog();
// Fetch the last message from the chat log. It should contain the tool calls.
const lastMessage = currentChatLog[currentChatLog.length - 1];
const toolCalls = lastMessage.tool_calls;
if (!toolCalls) {
    currentChatLog.push({
        role: 'system',
        content: 'No tool calls were found in the last message. Please try again.'
    });
    await writeChatlog(currentChatLog);
    kexec('node', process.env, ['src/bin/query.js']);
}

// Run each tool call
for (const toolCall of toolCalls ) {
    const {id, function: {name, arguments: args}} = toolCall;
    const argsParsed = JSON.parse(args);
    // look up the tool and run it
    const runner = tools[name].runner ?? (() => ({error: `No runner found for tool ${name}`}));
    console.log('\n------------------------\nRunning tool:', name);
    console.log('Arguments:', JSON.stringify(argsParsed, null, 2));
    const result = await runner(argsParsed);
    console.log('Result:', JSON.stringify(result, null, 2));
    currentChatLog.push({
        role: "tool",
        tool_call_id: id,
        content: JSON.stringify(result),
    });
}

// Return control to the query script
await writeChatlog(currentChatLog);
kexec('node', process.env, ['src/bin/query.js']);
