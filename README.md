<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## CI/CD Pipeline

> Config: `.github/workflows/ci.yml` (active: `test` + `docker-build`, commented: `deploy-aws` + `notify-slack`) | Reusable: `.github/actions/setup-and-test/action.yml`

**Triggers**

```yaml
on:
  push: branches [main]
  pull_request: branches [main]
```
Runs on every push/PR to `main` — feature branches are gated at PR time. No manual `workflow_dispatch`.

### Jobs

| Job | Needs | What it does | Key config | Implication |
|-----|-------|--------------|------------|-------------|
| **`test`** | — | Full verification: `npm ci` → `prisma generate` → `prisma migrate deploy` → `npm test` → `npm run test:e2e` | Service `postgres:16-alpine` with `pg_isready` healthcheck; `env.DATABASE_URL=postgresql://test:test@localhost:5432/test_db` mapped to `localhost` | Disposable DB per run (isolated, destroyed after). `migrate deploy` validates migrations idempotently; unit tests (mocked `PrismaService`) don't need DB, e2e (`test/app.e2e-spec.ts` bootstraps `AppModule`) does — hence the service. Falls back to dev `JWT_SECRET` if not set in CI. |
| **`docker-build`** | `test` | Prove image builds: `docker/setup-buildx@v3` + `docker/build-push-action@v6` (`push:false`, `tags: my-app:ci-test`, `cache gha`) | Multi-stage `Dockerfile` (`node:20-alpine` builder → runtime, copies `dist`, `generated`, `prisma`) | `needs: test` blocks bad images. `push:false` means no registry upload — build-only verification. Fix `start:prod` to `node dist/src/main` (was `dist/main`). |
| **`deploy-aws`** | `docker-build` | **COMMENTED** — ECR push + ECS deploy | `if: main push`, `permissions: id-token/write` (OIDC), `aws-actions/configure-aws-credentials@v4` (`AWS_ROLE_TO_ASSUME`), `amazon-ecr-login@v2`, `build-push-action` `push:true` to `${registry}/${ECR_REPOSITORY}:${sha}`, `aws ecs update-service --force-new-deployment && wait services-stable` | Requires `secrets.AWS_ROLE_TO_ASSUME`, `vars.AWS_REGION/ECR_REPOSITORY/ECS_CLUSTER/ECS_SERVICE`. Uncomment when OIDC/ECR/ECS ready. Alternative EB/App Runner steps included commented. |
| **`notify-slack`** | `[test,docker-build]` (or `deploy-aws`) | **COMMENTED** — Slack notify on `always()` | `slackapi/slack-github-action@v2` `chat.postMessage` with `blocks` mrkdwn, or webhook `curl SLACK_WEBHOOK_URL` | Requires `secrets.SLACK_BOT_TOKEN` or `SLACK_WEBHOOK_URL` + `vars.SLACK_CHANNEL_ID`. Success/failure split via `needs.*.result`. Uncomment after creating Slack app. |

**Reuse:** `.github/actions/setup-and-test/action.yml` bundles `checkout + setup-node@20 + npm ci + prisma generate + npm test` as composite — currently unused (duplicated inline in `ci.yml`).

**Flow:** `push/PR → test (DB+ migrate+tests) → docker-build → [deploy-aws (commented) → slack (commented)]`. No CD until uncommented.

### How to enable CD

1. AWS: create IAM OIDC role + ECR repo + ECS cluster/service, add repo `Secrets: AWS_ROLE_TO_ASSUME` and `Vars: AWS_REGION, ECR_REPOSITORY, ECS_CLUSTER, ECS_SERVICE, APP_HEALTH_URL`, uncomment `deploy-aws` in `ci.yml`.
2. Slack: create app with `chat:write`, add `Secrets: SLACK_BOT_TOKEN` (or `SLACK_WEBHOOK_URL`) + `Vars: SLACK_CHANNEL_ID`, uncomment `notify-slack` (change `needs` to include `deploy-aws` if enabled).
3. `git push` to `main` will then auto deploy + notify.

### Local Docker

```bash
docker compose up --build  # postgres + app (migrate deploy auto), needs .env (see .env.example)
# prod without compose
docker build -t blog-backend . && docker run -p 3000:3000 -e DATABASE_URL=postgresql://... -e JWT_SECRET=... -e JWT_REFRESH_SECRET=... blog-backend
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
