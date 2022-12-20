
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

    arrange(scene) {
        console.log(this.people);
        for (let i = 0; i < this.people.length; i++) {
            let r = new RenderPerson(this.people[i], new Vector3(i * 1.5, 0, 0));
            this.people[i].render = r;
            this.people[i].render.addToScene(scene);
        }
        
    }

}
