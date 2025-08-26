# Contributing

## Setting up the environment

```bash
npm i
npm run build
```

This will install all the required dependencies and build output in `lib/`.

## Adding and running examples

You can run, modify and add new examples in `examples/` directory.

```bash
cd examples/
npm i
npm run tsn <example>.ts
```

## Linting and formatting

Thit repository uses [prettier](https://www.npmjs.com/package/prettier) and [eslint](https://www.npmjs.com/package/eslint) to format the code in the repository.

```bash
npm run lint
npm run format
```

## Publishing and release

You need run `scripts/publish-npm` script with an `NPM_TOKEN` set on environment after change version of package in `package.json`.

```bash
npm i
chmod +x scripts/publish-npm
./scripts/publish-npm
```
