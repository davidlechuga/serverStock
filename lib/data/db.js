import mongoose from 'mongoose'
import bcrypt from 'bcrypt'


mongoose.Promise = global.Promise;

mongoose.connect(`mongodb+srv://davidlechuga:1Diosasegur@cluster0-xcjjl.mongodb.net/test`, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

mongoose.set('setFindAndModify', false);
//  MONGO PIDE DEFINIR EL SCHEMA AL IGUAL QUE GRAPHQL
// Y POSTERIORMENTE CREAR EL MODELO  (tabla clientes) siguiendo su Schema para exportarlo
const clientesSchema = new mongoose.Schema ({
    nombre: String,
    apellido: String,
    empresa: String,
    emails: Array,
    edad: Number,
    tipo: String,
    pedidos: Array,
    vendedor: mongoose.Types.ObjectId 
});
const Clientes = mongoose.model('clientes', clientesSchema);


//Prouctos 

const productosSchema = new mongoose.Schema ({
    nombre: String,
    precio: Number,
    stock: Number
});
const Productos = mongoose.model('productox', productosSchema);


//Pedidos

const pedidosSchema = new mongoose.Schema({
    pedido: Array,
    total: Number,
    fecha: Date,
    cliente: mongoose.Types.ObjectId,
    estado: String,
    vendedor: mongoose.Types.ObjectId 
})
const Pedidos = mongoose.model('pedidox', pedidosSchema)

// Usuarios

const usuariosSchema = new mongoose.Schema({

    usuario: String,
    nombre: String,
    password: String,
    rol: String
});

// hashear los passwords antes de guardarlos en la base de datos

usuariosSchema.pre('save', function (next) {
    // si el password no esta modificado , ejecutar la funcion.
    if(!this.isModified('password')){
        return next();
    }
    //explicaicon video 158 o documentacion
    bcrypt.genSalt(10, (err, salt) => {
        if(err) return next (err);

        bcrypt.hash(this.password,salt, (err, hash) => {
            if (err) return next (err);
            this.password = hash;
            next();
        });
    })
});

const Usuarios = mongoose.model('Usuarioos', usuariosSchema )


export {Clientes,Productos, Pedidos, Usuarios};