#!/usr/bin/env node
//
// Copyright (c) 2024 Alexandru Catrina <alex@codeissues.net>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import { Worker, isMainThread, parentPort } from "worker_threads";
import { readFileSync, writeFileSync } from "fs";
import repository, * as vivid from "vivid";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { basename } from "path";
import { JSDOM } from "jsdom";

const [lsx, ...resources] = process.argv.slice(2); // 1st node.js, 2nd this file

// *****************************************************************************

if (isMainThread) {
    const startTime = new Date().getTime();
    const _filename = fileURLToPath(import.meta.url);

    function elapsedTime() {
        const ts = new Date().getTime() - startTime;

        process.stdout.write(`\r${Number(ts / 1000).toFixed(3)} sec(s)`);
    }

    const loader = setInterval(elapsedTime, 1);
    const worker = new Worker(_filename, { argv: [lsx, ...resources] });

    worker.on("message", data => {
        clearInterval(loader);
        process.stdout.write(` — done\n`);
        writeFileSync(basename(lsx) + ".json", JSON.stringify(data, null, 2));
    });
}

// *****************************************************************************

else {
    const script = readFileSync(lsx, "utf8");
    const binary = vivid.Compile(script);
    const program = vivid.Read(binary);

    const outputs = []; // optional, populated by prompts
    const prompts = Object
        .keys(process.env)
        .filter(a => a.startsWith("LSX_PROMPT_"))
        .map(a =>
            [a.replace("LSX_PROMPT_", "").toLowerCase(),
            function prompt(...args) {
                const cmd = process.env[a];
                const input = JSON.stringify(this); // stdin
                const { stdout, stderr } = spawnSync(cmd, args, { input });

                outputs.push({
                    prompt: a,
                    output: stdout.toString(),
                    error: stderr.toString(),
                    input: this,
                    args
                });
            }]
        );

    vivid.Config(Object.fromEntries(prompts));

    for (const r of resources) {
        vivid.Setup({ document: (await JSDOM.fromFile(r)).window.document });

        for (const _ of vivid.Interpret(program));
    }

    parentPort.postMessage([repository, ...outputs]);
}