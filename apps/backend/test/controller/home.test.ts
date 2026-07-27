import { HomeController } from '../../src/controller/home.controller';

describe('test/controller/home.test.ts', () => {

  it('should GET /', async () => {
    const controller = new HomeController();

    const result = await controller.home();

    expect(result).toBe('Hello Midwayjs!');
  });

});
