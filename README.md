This repository contains a layout/script executable.

#

Usage:
```
$ lsx file.ls resource1 resource2 [...]
```

Or with shebang
```
$ head file.ls
#!/usr/bin/env lsx
layout  vivid 1.0
...

$ ./file.ls resource1 resource2 [...]
```

Prompts can be exported either inline or through a file that can be sourced:
```
$ cat prompts
export LSX_PROMPT_DEBUG=debug.sh

$ source prompts
$ lsx ...
```

The repository aggregates all outputs from all given resources.