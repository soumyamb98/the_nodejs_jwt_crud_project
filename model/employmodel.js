const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://ks_smmart:aPZAsutyIsa8@kssmart-acluster.hkgsj.mongodb.net/employdatasksa', { useNewUrlParser: true }).then(() => console.log('mongo connected')).catch(err => console.log(err));
const schema = mongoose.Schema;
const employschema = new schema({
    name: String,
    gender: String,
    designation: String,
    city: String,
    image: String

})


var employdata = mongoose.model('employdata', employschema);
module.exports = employdata;