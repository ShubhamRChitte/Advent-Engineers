const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const { UserModel } = require("../models/UserModel");

module.exports = (passport) => {
    passport.use(
        new LocalStrategy(
            { usernameField: "employeeId" }, // Match schema field
            async (employeeId, password, done) => {
                try {
                    // 1. Find user by employeeId
                    const user = await UserModel.findOne({ employeeId });
                    if (!user) {
                        return done(null, false, { message: "User not found" });
                    }

                    // 2. Compare password
                    const isMatch = await bcrypt.compare(password, user.password);
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: "Incorrect password" });
                    }
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    // Serialize User (Store ID in session)
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize User (Retrieve user from session)
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await UserModel.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};
