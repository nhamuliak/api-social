import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((param: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    if (param) return request.user[param];

    return request.user;
});
