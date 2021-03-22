# sample-storage-demo

The base sample for storing file by using Crust

## Build
```shell
yarn
yarn build
```

## Run
```shell
# ${seeds} example: "echo xxxx soccer xxxx catch xxxx stone xxxx pumpkin nest merge xxxx"
# ${chain_ws} example: "ws://127.0.0.1:9933"
# ${file_path} example: "test.txt"
yarn start ${seeds} ${chain_ws} ${file_path}
```