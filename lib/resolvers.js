import mongoose from 'mongoose';
import {Clientes,Productos,Pedidos, Usuarios } from './data/db';
import {rejects} from 'assert';
import bcrypt from 'bcrypt';

const ObjectId = mongoose.Types.ObjectId;

//Generar token 
import dotenv from 'dotenv';
dotenv.config({path: 'variables.env'});

import jwt from 'jsonwebtoken';
// 3 parametros a) usuario   b) llave secreta env c) tiempo de expiracion
const crearToken = ( usuarioLogin, secreto, expiresIn ) => {
    const {usuario} = usuarioLogin;
    //aplicamos destructuring y lo enviamos como objeto 
    return jwt.sign({usuario},secreto,{expiresIn});
}

export const resolvers = {
    Query : {
        //AGREGANDO LIMITES AL GET (schema.graphql modificado y resolvers).  
        // LIMITE Y OFFSET SON DE MONGOOSE Y NOS AYUDAN A HACER PAGINACIONES.
         getClientes: (root, {limite,offset, vendedor}) => {
             let filtro;
             if(vendedor) {
                 filtro = {vendedor: new ObjectId(vendedor) }
             }
            return Clientes.find(filtro).limit(limite).skip(offset)
        },
        // EL return promise da encuenta un registro segun filtro (id) / callback (error,  cliente) 
        getCliente: (root, {id}) => {
            return new Promise ((resolve, object) => {
                Clientes.findById(id, (error, cliente)=> {
                    if (error) rejects (error)
                    else resolve (cliente)
                });
            });
        },
        totalClientes : (root, { vendedor } ) => {
            return new Promise ((resolve, object) => {
                let filtro;
                    if(vendedor) {
                 filtro = {vendedor: new ObjectId(vendedor) }
                }
                // COUNTDOCUMENT PARA SABER CUANTOS DOCUMENTOS HAY EN LA BASE DE DATOS Clientes.
                Clientes.countDocuments( filtro, (error, count) => {
                    if (error) rejects (error)
                    else resolve (count)
                })
            })
        },
        // mongoose define limite y offset
        //Productos viene del db schema
        obtenerProductos: (roor, {limite, offset, stock}) => {
            let filtro;
            if(stock) {
                filtro = { stock: { $gt : 0 } }
            }
            return Productos.find(filtro).limit(limite).skip(offset)
        },
        obtenerProducto : (root, {id}) => {
            return new Promise ((resolve,object) => {
                Productos.findById(id, (error, producto) => {
                    if (error) rejects (error)
                    else resolve (producto)
                })
            })
        },
        totalProductos : (root ) => {
            return new Promise ((resolve, object) => {
                // COUNTDOCUMENT PARA SABER CUANTOS DOCUMENTOS HAY EN LA BASE DE DATOS Clientes.
                Productos.countDocuments({}, (error, count) => {
                    if (error) rejects (error)
                    else resolve (count)
                })
            })
        },
        obtenerPedidos: (root, {cliente}) => {
            return new Promise ((resolve, object) => {
                Pedidos.find({cliente : cliente }, (error, pedido) => {
                    if (error) rejects (error);
                    else resolve (pedido);
                })
            })
        },
        topClientes: (root) => {
            return new Promise ((resolve,object) => {
                Pedidos.aggregate([
                    {$match : {estado: "COMPLETADO" }},
                    { $group : {
                        _id: "$cliente",
                        total: { $sum : "$total"} 
                    }
                },
                {
                    $lookup : {
                        from : "clientes",
                        localField : '_id',
                        foreignField : '_id',
                        as : 'cliente'
                    }
                },
                {
                    $sort : {total : -1}
                },
                {
                    $limit : 10
                }
                ], (error, resultado) => {
                    if (error) rejects (error);
                    else resolve (resultado);
                })
            })
        },
        obtenerUsuario: ( root, args, { usuarioActual }) => {
            if (!usuarioActual) {
                return null
            }
            console.log(usuarioActual);
            // Obtener el usuario actual del request del JWT verificado.
            const usuario = Usuarios.findOne({usuario: usuarioActual.usuario});
            return usuario;
        },
        topVendedores: (root) => {
            return new Promise ((resolve,object) => {
                Pedidos.aggregate([
                    {$match : {estado: "COMPLETADO" }},
                    { $group : {
                        _id: "$vendedor",
                        total: { $sum : "$total"} 
                    }
                },
                {
                    $lookup : {
                        from : "usuarios",
                        localField : '_id',
                        foreignField : '_id',
                        as : 'vendedor'
                    }
                },
                {
                    $sort : {total : -1}
                },
                {
                    $limit : 10
                }
                ], (error, resultado) => {
                    if (error) rejects (error);
                    else resolve (resultado);
                })
            })
        }
    },

    Mutation: {
            crearCliente : (root, {input}) => {
            // root es para que no mande error en consola 
            // EN INPUT SON LOS OBJETOS REQUERIDOS POR EL SCHEMA DE GRAPHQL PARA QUE SE CREE EN GRAPHQL , NO SOLO EN MONGOOSE
            // ESTAMOS CREANDO UN nuevoCliente SEGUN EL MODELO DE MONGOOSE
            const nuevoCliente = new Clientes({
        
                nombre : input.nombre,
                edad : input.edad,
                apellido : input.apellido,
                emails : input.emails,
                empresa : input.empresa,
                tipo : input.tipo,
                pedidos : input.pedidos,
                vendedor: input.vendedor

            });
            //SACAMOS EL ID QUE CREA MONGO
            // RETORNAMOS EL CLIENTE CREADO EN MONGO , Y  YA SALVADO  MEDIANTE UNA PROMESA
            nuevoCliente.id = nuevoCliente._id;

            return  new Promise  ((resolve, object ) => {
                nuevoCliente.save((error) => {
                    if (error) rejects (error)
                    else resolve (nuevoCliente)
                })
            }); 
       },
            // FUNCION PARA ACTULIZAR CLIENTES MEDIANTE METODOS DE MONGOOSE SEGUN EL PARAMETRO _id del MUTATION SCHEMA (GRAPHQL)
            actualizarCliente: (root, {input})=> {
                return new Promise ((resolve, object)=>{
                    Clientes.findOneAndUpdate({_id : input.id}, input, {new:true}, (error, cliente) =>{
                        if (error) rejects (error)
                        else resolve(cliente)
                });
            });
        },
            // FUNCION PARA ELIMINAR CLIENTES MEDIANTE METODOS DE MONGOOSE SEGUN EL PARAMETRO _id del ClienteInputSCHEMA (GRAPHQL)
            eliminarCliente: (root, {id}) => {
                return new Promise ((resolve, object)=>{
                    Clientes.findOneAndRemove({_id : id}, (error) =>{
                        if (error) rejects (error)
                        else  resolve ("El Cliente Se Elimino Correctamente")
                 })
            });
        },
            //1) dbmongoose lo declaramos su schema.
            // 2) en resolvers hacemos la promise de New Productos.
            // 3) le especificamos que va a tomar un input (no id, password).
            nuevoProducto : (root ,{input}) => {
                // Productos viene de db(modelo , no schema).
                //esto crea un nuevo objeto con los datos que estamos pasando (nuevoProducto).
                //  en Schem.gql el objeto nuevoProducto (que sigue un shcema) se declara en MUTATIONS CON UN INPUT 
                //  SE CREAL EL PoductosInput   y el type de Productos 
                const nuevoProducto = new Productos({
                    nombre: input.nombre,
                    precio: input.precio,
                    stock: input.stock
                }); 
                nuevoProducto.id = nuevoProducto._id;
                return new Promise ((resolve, object) => {
                    nuevoProducto.save((error)=> {
                        if( error ) rejects (error)
                        else resolve (nuevoProducto) 
                    })
                });
        },
            actualizarProducto : (root, {input}) => {
                return new Promise ((resolve, producto) => {
                    Productos.findOneAndUpdate ({_id: input.id }, input , {new: true}, (error, producto) => {
                        if( error ) rejects (error)
                        else resolve (producto) 
                    }) 
            });
        },
            eliminarProducto : (root,{id}) => {
                return new Promise ((resolve, producto) => {
                    Productos.findOneAndDelete({_id : id } , (error) => {
                        if (error) rejects (error);
                        else resolve ( 'El Producto Se Eliminó Correctamente')
                    })
            });
        },
            nuevoPedido : (root, {input}) => {
                const nuevoPedido = new Pedidos({
                    //construccion del objeto (DBshcema)
                    pedido: input.pedido,
                    total: input.total,
                    fecha: new Date(),
                    cliente: input.cliente,
                    estado:"PENDIENTE",
                    vendedor: input.vendedor

                });
                    nuevoPedido.id = nuevoPedido._id;

                return new Promise ((resolve, object) => {

                    nuevoPedido.save((error) => {
                        if(error) rejects (error)
                        else resolve (nuevoPedido)
                    })
                })
            },

            actualizarEstado : (root, {input}) => {
                return new Promise ((resolve, object) => {
                    // console.log(input);
                    const {estado} = input;

                    let instruccion;
                    if(estado === 'COMPLETADO'){
                        instruccion = "-";
                    } else if (estado === 'CANCELADO') {
                        instruccion = "+";
                    }
                    //recorrer y actualizar la cantidad de productos en base  al estado del pedido.
                    input.pedido.forEach(pedido =>  {
                        // modificando la DB de Productos , aunque estemos haciendo un Pedido.
                        Productos.updateOne({ _id : pedido.id },
                            { "$inc" : 
                            //restando la cantidad pedida segun la DB de pedidos
                            { "stock" : `${instruccion}${pedido.cantidad}` }
                        }, function (error){
                            if (error) return new Error (error)
                        }
                        )
                    });


                    Pedidos.findOneAndUpdate({_id : input.id }, input , {new: true }, (error) => {
                        if (error) rejects (error);
                        else resolve ('Se actulizo correctamoente')
                    })
                })
            },
            crearUsuario: async (root, {usuario, nombre, password, rol}) => {
                //revisar si el un usuario tienen el mismo pasword
                const existeUsuario = await Usuarios.findOne({usuario});
                if (existeUsuario){
                    throw new Error ('El Usuario ya Existe');
                }
                const nuevoUsuario = await new Usuarios ({
                    usuario,
                    nombre,
                    password,
                    rol
                    //save guarda en DB mongo
                }).save();
                // console.log(nuevoUsuario);
                return "creado correctamente";
            },
            autenticarUsuario: async  (root, {usuario, password}) => {
                const nombreUsuario = await Usuarios.findOne({usuario});

                if(!nombreUsuario){
                    throw new Error ('El usuario no encontrado');
                }
                //parametros el string y el id hasheado
                const passwordCorrecto = await bcrypt.compare(password, nombreUsuario.password);
                // si el password es incorrecto 
                if (!passwordCorrecto){
                    throw new Error ('Password Incorrecto');
                } 

                return {
                    token: crearToken(nombreUsuario,
                    process.env.SECRETO, '1hr')
                }
            }  
    }
}
//EL RESOLVER FUNCION QUE DA RESULTADO DE NUESTRAS CONSULTAS (interacciones con shcema de graphql)
//AQUI NUESTROS RESOLVERS / SCHEMAS / Y EXPRESS ESTAN CONECTADOS 
export default  resolvers