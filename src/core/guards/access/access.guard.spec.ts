import { AccessGuard } from './access.guard';

describe('AccessGuard', () => {
    let accessGuard: AccessGuard;

    beforeEach(() => {
        accessGuard = new AccessGuard();
    });

    it('should be defined', () => {
        expect(accessGuard).toBeDefined();
    });
});
