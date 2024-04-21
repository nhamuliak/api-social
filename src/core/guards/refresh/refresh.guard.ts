import { AuthGuard } from '@nestjs/passport';
import { CanActivate, Injectable } from '@nestjs/common';
import { REFRESH_STRATEGY_NAME } from '@utils/constants';

@Injectable()
export class RefreshGuard extends AuthGuard(REFRESH_STRATEGY_NAME) implements CanActivate {
    constructor() {
        super();
    }
}
