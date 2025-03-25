import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: function() {
            // La password è obbligatoria solo se non c'è un googleId
            return this.googleId === null || this.googleId === undefined;
        }
    },
    role: {
        type: String,
        enum: ["Editor", "Admin"],
        default: "Editor",
    },
    avatar: {
        type: String, // URL dell'immagine caricata
        default: null,
    },
    googleId: {
        type: String,
        default: null,
    }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
