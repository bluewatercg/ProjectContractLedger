import { Configuration, App, Inject } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import * as typeorm from '@midwayjs/typeorm';
import * as swagger from '@midwayjs/swagger';
import * as upload from '@midwayjs/upload';
import { join } from 'path';
import { DefaultErrorFilter } from './filter/default.filter';
import { NotFoundFilter } from './filter/notfound.filter';
import { ReportMiddleware } from './middleware/report.middleware';
import { CorsMiddleware } from './middleware/cors.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';
import { KitMiddleware } from './middleware/kit.middleware';
import { WecomService } from './service/wecom.service';

@Configuration({
  imports: [
    koa,
    validate,
    typeorm,
    swagger,
    upload,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  @Inject()
  wecomService: WecomService;

  async onReady() {
    // add middleware (CORS -> Report -> Auth -> Kit)
    this.app.useMiddleware([CorsMiddleware, ReportMiddleware, AuthMiddleware, KitMiddleware]);

    // add filter
    this.app.useFilter([NotFoundFilter, DefaultErrorFilter]);
  }
}
