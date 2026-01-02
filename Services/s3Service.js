import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { MESSAGES } from '../Utils/status.codes.messages.js';

const s3Client = new S3Client({
    endpoint: `https://${process.env.DO_SPACES_ENDPOINT}`,
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
});

const uploadFileToSpaces = async (file, folder = 'misc') => {
    if (!file || !file.buffer) {
        throw new Error(MESSAGES.NO_FILE_UPLOADED);
    }

    const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
    const fileName = `${folder}/${uniqueSuffix}`;

    const params = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ACL: "public-read",
        ContentType: file.mimetype,
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        const url = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${fileName}`;
        console.log("✅ File uploaded to Spaces:", url);
        return url;
    } catch (err) {
        console.error("❌ Error uploading file to Spaces:", err);
        throw new Error(MESSAGES.INTERNAL_SERVER_ERROR + ': ' + err.message);
    }
};

const uploadMultipleFilesToSpaces = async (files, folder = 'misc') => {
    if (!files || files.length === 0) {
        return [];
    }
    const uploadPromises = files.map(file => uploadFileToSpaces(file, folder));
    return Promise.all(uploadPromises);
};

const deleteFileFromSpaces = async (fileUrl) => {
    if (!fileUrl) {
        console.warn('Attempted to delete file with empty URL.');
        return false;
    }

    const bucketName = process.env.DO_SPACES_BUCKET;

    let key;
    try {
        const urlParts = new URL(fileUrl);
        key = urlParts.pathname.substring(1);
    } catch (e) {
        console.error('Invalid file URL for deletion:', fileUrl, e);
        return false;
    }

    const deleteParams = {
        Bucket: bucketName,
        Key: key,
    };

    try {
        const command = new DeleteObjectCommand(deleteParams);
        await s3Client.send(command);
        console.log('File deleted from Spaces:', fileUrl);
        return true;
    } catch (error) {
        console.error('Error deleting file from Spaces:', error);
        return false;
    }
};

export { uploadFileToSpaces, uploadMultipleFilesToSpaces, deleteFileFromSpaces };