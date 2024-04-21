import { AuthGuard } from '@nestjs/passport';
import { CanActivate, Injectable } from '@nestjs/common';
import { ACCESS_STRATEGY_NAME } from '@utils/constants';

@Injectable()
export class AccessGuard extends AuthGuard(ACCESS_STRATEGY_NAME) implements CanActivate {
    constructor() {
        super();
    }
}
