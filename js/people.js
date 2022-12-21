
class Person {
    constructor(name, parent1Name, parent2Name, spouseName) {
        this.name = name;
        this.parent1 = null;
        this.parent2 = null;
        this.spouse = null;
        this.parent1Name = parent1Name;
        this.parent2Name = parent2Name;
        this.spouseName = spouseName;
        this.children = [];
        this.render = null;
        this.generation = NaN;
        
    }

    setRelations(peopleList) {
        for (let i = 0; i < peopleList.length; i++) {
            if (peopleList[i].name === this.parent1Name) {
                this.parent1 = peopleList[i];
                this.parent1.children.push(this);
            }
            if (peopleList[i].name === this.parent2Name) {
                this.parent2 = peopleList[i];
                this.parent2.children.push(this);
            }
            if (peopleList[i].name === this.spouseName) {
                this.spouse  = peopleList[i];
            }
        }
    }

    displayName() {
        return this.name;
    }
}

const layoutScaleX = 1.5;
const layoutScaleY = 1;

class FamilyTree {
    constructor(people) {
        this.people = people;
        this.roots = [];

        for (let i = 0; i < this.people.length; i++) {
            if (this.people[i].parent1 === null && this.people[i].parent2 === null) {
                this.roots.push(this.people[i]);
            }
        }
    }

    findPerson(name) {
        if (name === null) {
            return null;
        }
        for (let i = 0; i < this.people.length; i++) {
            if (this.people[i].name === name) {
                return this.people[i];
            }
        }
        return null;
    }

    addRenders(dag, scene, offsetX, offsetY) {
        let person = this.findPerson(dag.data.id);
        if (!person.render) {
            person.render = new RenderPerson(person,
                new Vector3(offsetX + layoutScaleX * dag.x, offsetY - layoutScaleY * dag.y, 0));
            person.render.addToScene(scene);
        }
        for (let i = 0; i < dag.dataChildren.length; i++) {
            this.addRenders(dag.dataChildren[i].child, scene, offsetX, offsetY);
        }
    }

    arrange(scene) {

        var dataArr = [];
        for (let i = 0; i < this.people.length; i++) {
            let _parents = [];
            if (this.findPerson(this.people[i].parent1Name)) {
                _parents.push(this.people[i].parent1Name);
            }
            if (this.findPerson(this.people[i].parent2Name)) {
                _parents.push(this.people[i].parent2Name);
            }
            if (_parents.length > 0) {
                dataArr.push({
                    id: this.people[i].name,
                    parentIds: _parents
                });
            }
            else {
                dataArr.push({
                    id: this.people[i].name
                });
            }
        }

        const stratify = d3.dagStratify();
        const dag = stratify(dataArr);
        const layout = d3.sugiyama()
            .decross(d3.decrossOpt());

        const {width, height} = layout(dag);

        for (let i = 0; i < dag.proots.length; i++) {
            this.addRenders(dag.proots[i], scene,
                (-2 - (width - 1) * layoutScaleX) / 2,
                (2 + (height - 1) * layoutScaleY) / 2);
        }
        
    }

    connect(scene) {
        for (let i = 0; i < this.people.length; i++) {
            // TODO: Store the connections in the people as they're created.
            if (this.people[i].parent1) {
                let conn = new RenderConnectionSimple(this.people[i].parent1, this.people[i], scene);
            }
            if (this.people[i].parent2) {
                let conn = new RenderConnectionSimple(this.people[i].parent2, this.people[i], scene);
            }
        }
    }

}
