import Joi from "joi";

const stringOrArraySchema = Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string()) // Or whatever type you expect in the array
).required()

export function validateMailerPayload(payload: any) {
    const schema = Joi.object({
        to: stringOrArraySchema,
        title: Joi.string().required(),
        body: Joi.string().required(),
    });

    return schema.validate(payload);
}

export function validateFirebasePayload(payload: any) {
    const schema = Joi.object({
        to: stringOrArraySchema,
        title: Joi.string().required(),
        body: Joi.string().required(),
        data: Joi.object().optional()
    });

    return schema.validate(payload);
}

export function validateTwilioPayload(payload: any) {
    const schema = Joi.object({
        to: stringOrArraySchema,
        body: Joi.string().required(),
    });

    return schema.validate(payload);
}