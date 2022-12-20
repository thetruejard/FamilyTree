
var ExcelToJSON = function(file, callback) {
    var reader = new FileReader();

    reader.onload = function(e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, {
            type: 'binary'
        });
        workbook.SheetNames.forEach(function(sheetName) {
            // Here is your object
            var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            callback(XL_row_object);
        });
    };

    reader.onerror = function(ex) {
        console.log(ex);
    };

    reader.readAsBinaryString(file);
};


var parseFamily = function(family) {
    let people = []
    for (let i = 0; i < family.length; i++) {
        if (family[i]["Name"]) {
            people.push(new Person(
                family[i]["Name"],
                family[i]["Parent 1"] ? family[i]["Parent 1"] : null,
                family[i]["Parent 2"] ? family[i]["Parent 2"] : null,
                family[i]["Spouse"] ? family[i]["Spouse"] : null,
            ));
        }
    }
    for (let i = 0; i < people.length; i++) {
        people[i].setRelations(people);
    }

    // TODO: Scan for cycles.

    return new FamilyTree(people);
}


