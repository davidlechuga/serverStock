import express from 'express'
//GRAPHQL
// import graphqlHTTP from 'express-graphql' // contetar graphql con express
import {ApolloServer} from 'apollo-server-express'; // contetar graphql con express
import {typeDefs} from './lib/schema';
import {resolvers} from './lib/resolvers';

import jwt from 'jsonwebtoken';

//Generar token 
import dotenv from 'dotenv';
dotenv.config({path: 'variables.env'});

const app = express();

 //INICIALIZAR UN SERVIDOR
const server = new ApolloServer({ 
    typeDefs,
    resolvers,
    context: async({req}) => {
        //obtener el token del servidor
        const token = req.headers['authorization'];
        // console.log(token);
        if(token !== "null"){
            try {
                //verificar el token del front end
                const usuarioActual = await jwt.verify(token, process.env.SECRETO);
                // agregamos el usuario actal al request
                console.log(usuarioActual);
                
                req.usuarioActual = usuarioActual;

                return{
                    usuarioActual
                }

            }  catch(err){
                console.error(err);  
            }
        }
        
    }
});
// SE CONECTA  APOLLO SERVER CON EXPRESS
server.applyMiddleware({app})
app.listen({port: 4002}, () => console.log(`server on http://localhost:4002${server.graphqlPath}`));
