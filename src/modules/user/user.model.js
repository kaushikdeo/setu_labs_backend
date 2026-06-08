"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.UserRole = void 0;
const mongoose_1 = require("mongoose");
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["QA_REVIEWER"] = "qa_reviewer";
    UserRole["VALIDATION_ENGINEER"] = "validation_engineer";
    UserRole["CALIBRATION_ENGINEER"] = "calibration_engineer";
    UserRole["VALIDATION_HEAD"] = "validation_head";
    UserRole["CUSTOMER"] = "customer";
    UserRole["AUDITOR"] = "auditor";
    UserRole["SALES"] = "sales";
    UserRole["SALES_MANAGER"] = "sales_manager";
})(UserRole || (exports.UserRole = UserRole = {}));
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.VALIDATION_ENGINEER },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', default: null },
    refreshTokenHash: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    onboardingCompleted: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.passwordHash;
            delete ret.refreshTokenHash;
            delete ret.__v;
            if (ret.customerId) {
                ret.customerId = ret.customerId.toString();
            }
            return ret;
        },
    },
});
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
