// Data provider code
function using(name, values, func){
  for (var i = 0, count = values.length; i < count; i++) {
    func.apply(this, [values[i]]);
    console.log('jasmine', jasmine);
    jasmine.getEnv().currentSpec.description += ' (with "' + name + '" using ' + values[i].join(', ') + ')';
  }
}
