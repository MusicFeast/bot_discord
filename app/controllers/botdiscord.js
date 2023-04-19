//autoCode api para discord
const lib = require('lib')({token: process.env.TOKEN_DISCORD});

//consultas theGraph
const colsutaGraphql = require('../../config/dataThegraph')
const gql = require('graphql-tag');

//consultas bd pg
const dbConnect = require('../../config/postgres')



//activar roles en discord, dependiendo de los nft tier que tenga el usuario
const activeRol = async (req, res) => {
    console.log(process.env.TOKEN_DISCORD)
    try {
        const { wallet } = req.body
        let conexion = await dbConnect()

        let valid_user = await conexion.query(" select id, wallet, discord_id from backend_userdiscord bu where wallet = $1 ", [wallet]);

        if(valid_user.rows.length <= 0) { 
            res.status(500).json({result: "error", data: "El usuario near no tiene cuenta discrod registrada"}) 
        } else {
            let user_discrod = valid_user.rows[0].discord_id
            let user_id = valid_user.rows[0].id

            console.log("esta es la wallet - ", wallet, "user discrod: ", user_discrod)
            let queryGql = gql`
                query MyQuery($wallet: String!) {
                    nfts(where: {owner_id: $wallet, reference: "1"}) {
                        serie_id
                        owner_id
                        artist_id
                    }
                }
            `;

            let variables = { wallet: wallet }

            let nft = await colsutaGraphql(queryGql, variables)
            //console.log(nft.nfts)

            if (!nft.nfts.length > 0) {
                return res.status(204).send({ error: "El usuario no tiene nfts"})
            } 

            let result = Array.from(new Set(nft.nfts.map(item => { return item.artist_id })));

            let artistas = ""
            result.forEach((item, i) => { 
                artistas += (result.length -1) != i ? item+',' : item
            })
            console.log("resultado artistas_id: ", artistas)
            
            let resultados = await conexion.query("   select bad.id, ba.id_collection as artist_id, role_id \
                                                        from backend_artistdiscord bad \
                                                        inner join backend_artist ba on ba.id = bad.artist_id  \
                                                        where ba.id_collection in (" + artistas + ")  \
            ");
            console.log(resultados.rows)

            let rol_user = await conexion.query(" select bad.role_id, bud.wallet  \
                from backend_userroles bu \
                inner join backend_artistdiscord bad on bad.id = bu.role_id \
                inner join backend_userdiscord bud on bud.id = bu.user_id \
                where bud.wallet = $1 \
                group by bad.role_id, bud.wallet \
            ", [wallet])
            console.log("resultado rol_user", rol_user.rows)
            for(let i = 0; i < resultados.rows.length; i++) {
                let rol_id = resultados.rows[i].role_id.toString()
                console.log("rol_id: ", rol_id, rol_user.rows.find(item => item.role_id == rol_id))
                console.log("rol_user: ", rol_user.rows)
                
                let valid_rol_id = rol_user.rows.length > 0 ? rol_user.rows.find(item => item.role_id == rol_id) == undefined ? '' : rol_user.rows.find(item => item.role_id == rol_id)['role_id'] : ''
                console.log("rol_id", rol_id, valid_rol_id)
                console.log("debug", valid_rol_id, rol_id)
                
                if(valid_rol_id != rol_id) {
                    await lib.discord.guilds['@0.1.0'].members.roles.update({
                        guild_id: process.env.GUILD_ID,
                        user_id: user_discrod,
                        role_id: rol_id,
                      });
                    await conexion.query(" insert into backend_userroles (role_id, user_id) values($1, $2) ", [resultados.rows[i].id, user_id])
                }
            }
            /*
            {
                    guild_id: '1053340402633150485',
                    user_id: user_discrod,
                    role_id: resultados.rows[i].role_id.toString(),
                }
            */
            /*await lib.discord.guilds['@0.1.0'].members.roles.update({
                guild_id: '1053340402633150485',
                user_id: user_discrod.toString(),
                role_id: '1053401086242857049',
            });*/

            res.json({result: "exito", data: ""})
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({result: "error", data: error})
    }
}



module.exports = { activeRol }





















