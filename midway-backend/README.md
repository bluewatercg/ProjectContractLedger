# Contract Ledger - Backend API

Backend API service built with Midway v3 framework.

## QuickStart

### Development

```bash
$ yarn install
$ yarn dev
$ open http://localhost:8080/
```

### Production Deploy

```bash
$ yarn build
$ yarn start
```

### Available Scripts

- `yarn dev` - Start development server (Port: 8080)
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn test` - Run unit tests
- `yarn lint` - Check code style
- `yarn lint:fix` - Auto fix code style issues

### API Documentation

Visit: http://localhost:8080/api-docs after starting the server

### Tech Stack

- **Framework**: Midway v3 + Koa
- **Database**: MySQL + TypeORM
- **Authentication**: JWT
- **Validation**: @midwayjs/validate
- **Documentation**: Swagger

See [midway docs][midway] for more detail.

[midway]: https://midwayjs.org
