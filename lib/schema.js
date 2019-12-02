// IMPORTAR EL SCHEMA CON GRAPQHL-IMPORT 
import {importSchema} from 'graphql-import'
// IMPORTAR ARCHIVO SCHEMA.GRAPHQL
const typeDefs = importSchema('lib/schema.graphql');
//EXPORTAR DEFS
export {typeDefs}