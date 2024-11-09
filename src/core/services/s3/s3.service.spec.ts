import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3');

describe('S3Service', () => {
    let service: S3Service;
    let s3Client: jest.Mocked<S3Client>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [S3Service]
        }).compile();

        service = module.get<S3Service>(S3Service);
        s3Client = service['s3'] as jest.Mocked<S3Client>;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('uploadFile', () => {
        it('should upload a file to S3 and return its URL', async () => {
            const mockFile = {
                originalname: 'test.jpg',
                buffer: Buffer.from('test-buffer'),
                mimetype: 'image/jpeg'
            } as Express.Multer.File;

            const mockKey = `test_${Date.now()}.jpg`;
            const expectedUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${mockKey}`;

            jest.spyOn(Date, 'now').mockReturnValueOnce(123456789); // Mock Date.now for predictable filename
            jest.spyOn(service, 'generateFileName').mockReturnValueOnce(mockKey);
            jest.spyOn(s3Client, 'send').mockResolvedValueOnce({} as never);

            const result = await service.uploadFile(mockFile);

            expect(service.generateFileName).toHaveBeenCalledWith(mockFile.originalname);
            expect(s3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
            expect(result).toBe(expectedUrl);
        });
    });

    describe('deleteFile', () => {
        it('should delete a file from S3', async () => {
            const mockFileKey = 'test_123456789.jpg';

            jest.spyOn(s3Client, 'send').mockResolvedValueOnce(undefined as never);

            await expect(service.deleteFile(mockFileKey)).resolves.toBeUndefined();

            expect(s3Client.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
        });
    });

    describe('generateFileName', () => {
        it('should generate a unique filename with a timestamp', () => {
            const fileName = 'example.png';

            jest.spyOn(Date, 'now').mockReturnValueOnce(123456789); // Mock Date.now

            const result = service['generateFileName'](fileName);

            expect(result).toBe('example_123456789.png');
        });
    });
});
