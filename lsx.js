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

import repository, * as vivid from "vivid";
import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import { JSDOM } from "jsdom";

const [lsx, ...resources] = process.argv.slice(2); // 1st node.js, 2nd this file

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
            const input = JSON.stringify(this); // stdin
            const { stdout, stderr } = spawnSync(process.env[a], args, { input });

            outputs.push({
                prompt: a,
                args,
                output: stdout.toString(),
                error: stderr.toString(),
                input: this,
            });
        }]
    );

vivid.Config(Object.fromEntries(prompts));

for (const r of resources) {
    vivid.Setup({ document: (await JSDOM.fromFile(r)).window.document });

    for (const _ of vivid.Interpret(program));
}

process.stdout.write(JSON.stringify([repository, ...outputs], null, 2));
