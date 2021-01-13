import { Express } from "express";
/* eslint-disable */
export function customBehaviour(application: Express, datastore: any) {
    console.log("Custom Behaviour for GoogleAuthentication.");
    application.get("/tokeninfo", (req, res, next) => {
        console.log("get fakegoogle tokeninfo");
        const queryParams = req.query;
        if (queryParams !== undefined && queryParams.access_token !== undefined) {
            const access_token = queryParams.access_token;
            if (access_token === "rightToken") {
                res.send({ 
                    expires_in: 2000,
                    email: "jerome.pramondon@geared-minds.com"
                });
            } else if (access_token === "expiredToken") {
                res.send({ 
                    expires_in: 0,
                    email: "toast@bacon.egg"
                });
            } else {
                res.send({ error: "invalid_token" });
            }
        } else {
            res.send({ error: "invalid_token" });
        }
    });
}
/* eslint-enable */