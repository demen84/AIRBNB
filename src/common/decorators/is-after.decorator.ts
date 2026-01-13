// DECORATOR NÀY XỬ LÝ LOGIC: NGAY_DI PHẢI SAU NGAY_DEN
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsAfter(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isAfter',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];

                    // Chuyển đổi sang Date nếu đang là string để so sánh chính xác
                    const dateValue = new Date(value);
                    const dateRelatedValue = new Date(relatedValue);

                    return !isNaN(dateValue.getTime()) &&
                        !isNaN(dateRelatedValue.getTime()) &&
                        dateValue > dateRelatedValue;
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} phải sau ngày ${args.constraints[0]}`;
                },
            },
        });
    };
}