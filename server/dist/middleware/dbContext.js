"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDbContext = void 0;
const db_1 = require("../db");
const withDbContext = async (req, res, next) => {
    const client = await db_1.pool.connect();
    try {
        if (!req.user) {
            client.release();
            return res.status(401).json({
                error: "Unauthorized"
            });
        }
        const { role, company_id, employee_id } = req.user;
        const headerCompanyId = req.get("x-company-id");
        await client.query("BEGIN");
        /* =====================================================
           SUPERADMIN
        ===================================================== */
        if (role === "superadmin") {
            await client.query(`SELECT set_config('app.current_role', $1, true)`, [role]);
            if (headerCompanyId &&
                headerCompanyId !== "" &&
                headerCompanyId !== "null") {
                console.log("SUPERADMIN IMPERSONATING:", headerCompanyId);
                await client.query(`SELECT set_config(
             'app.current_company_id',
             $1,
             true
           )`, [headerCompanyId]);
                await client.query(`SELECT set_config(
             'app.god_mode',
             'false',
             true
           )`);
            }
            else {
                console.log("SUPERADMIN GOD MODE");
                await client.query(`SELECT set_config(
             'app.god_mode',
             'true',
             true
           )`);
                await client.query(`SELECT set_config(
             'app.current_company_id',
             '',
             true
           )`);
            }
            if (employee_id) {
                await client.query(`SELECT set_config(
             'app.current_employee_id',
             $1,
             true
           )`, [String(employee_id)]);
            }
            req.db = client;
            res.on("finish", async () => {
                try {
                    await client.query("COMMIT");
                }
                catch {
                    await client.query("ROLLBACK");
                }
                finally {
                    client.release();
                }
            });
            return next();
        }
        /* =====================================================
           NORMAL USER
        ===================================================== */
        await client.query(`SELECT set_config(
         'app.current_company_id',
         $1,
         true
       )`, [String(company_id)]);
        await client.query(`SELECT set_config(
         'app.current_role',
         $1,
         true
       )`, [role]);
        await client.query(`SELECT set_config(
         'app.god_mode',
         'false',
         true
       )`);
        if (employee_id) {
            await client.query(`SELECT set_config(
           'app.current_employee_id',
           $1,
           true
         )`, [String(employee_id)]);
        }
        req.db = client;
        res.on("finish", async () => {
            try {
                await client.query("COMMIT");
            }
            catch {
                await client.query("ROLLBACK");
            }
            finally {
                client.release();
            }
        });
        next();
    }
    catch (err) {
        await client.query("ROLLBACK");
        client.release();
        next(err);
    }
};
exports.withDbContext = withDbContext;
