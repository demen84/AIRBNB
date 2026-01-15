import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
    provide: 'CLOUDINARY',
    inject: [ConfigService], // Tiêm ConfigService vào đây
    useFactory: (config: ConfigService) => {
        // const cloudName = config.get<string>('CLOUDINARY_NAME');
        // console.log('--- CLOUDINARY CONFIG LOADED ---');
        // console.log('Cloud Name:', cloudName); // Xem nó in ra "dvy9hugde" hay "undefined"

        return cloudinary.config({
            cloud_name: config.get<string>('CLOUDINARY_NAME'),
            api_key: config.get<string>('CLOUDINARY_API_KEY'),
            api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
        });
    },
};