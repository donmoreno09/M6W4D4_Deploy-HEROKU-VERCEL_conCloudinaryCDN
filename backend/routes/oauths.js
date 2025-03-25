import { Router } from "express";
import passport from "passport";

const router = Router();

router.get("/login-google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/callback-google", 
    passport.authenticate("google", { session: false }),
    (req, res) => {
        // Reindirizza l'utente alla pagina di login con il token JWT nell'URL
        res.redirect(`${process.env.FRONTEND_HOST}/?token=${req.user.jwtToken}`);
    }
);

export default router;