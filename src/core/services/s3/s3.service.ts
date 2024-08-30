import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';
import * as process from 'node:process';

@Injectable()
export class S3Service {
    private readonly s3: S3Client;
    private readonly bucketName: string = process.env.AWS_S3_BUCKET_NAME;

    constructor() {
        this.s3 = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
    }

    public async uploadFile(file: Express.Multer.File): Promise<string> {
        const key = this.generateFileName(file.originalname);

        const params: PutObjectCommandInput = {
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        };

        const command = new PutObjectCommand(params);

        await this.s3.send(command);

        return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    }

    public deleteFile(fileKey: string): Promise<any> {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey
        });

        return this.s3.send(command);
    }

    private generateFileName(fileName: string): string {
        const fileNameArr: string[] = fileName.split('.');

        const prefix: string = fileNameArr.pop();

        return `${fileNameArr.join('.')}_${Date.now()}.${prefix}`;
    }
}
