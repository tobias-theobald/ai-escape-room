// This script sends the current chat log to the AI proxy server and handles the response.
// Afterwards it will run the tools that the AI suggested.

import kexec from '@triggi/native-exec';
import {readOrInitializeChatlog, writeChatlog} from "../chatlogAccessor.js";
import {toolDefinitionsForAi} from "../tools.js";

// Read the current chat log or initialize it
const currentChatLog = await readOrInitializeChatlog();

const url = 'http://ai-proxy/v1/chat/completions';

// Send the current chat log to the AI proxy server
const data = {
    model: "gpt-4o", // placeholder only. This may actually be another model.
    messages: currentChatLog,
    tool_choice: "required",
    tools: toolDefinitionsForAi,
};
const response = await fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
});

// Handle the response
if (!response.ok) {
    currentChatLog.push({
        role: 'system',
        content: 'The AI proxy server returned an error. Please try again.'
    });
    await writeChatlog(currentChatLog);
    kexec('node', process.env, ['src/bin/query.js']);
}

let responseData;
try {
    responseData = await response.json();
} catch (e) {
    currentChatLog.push({
        role: 'system',
        content: 'The AI proxy server returned an invalid response. Please try again.'
    });
    await writeChatlog(currentChatLog);
    kexec('node', process.env, ['src/bin/query.js']);
}

const message = responseData.choices[0].message;
currentChatLog.push(message);
await writeChatlog(currentChatLog);
kexec('node', process.env, ['src/bin/run-tools.js']);
