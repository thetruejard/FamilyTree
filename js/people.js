
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
        this.renderPartnerships = [];
        this.generation = NaN;
        
    }

    setRelations(peopleList) {
        for (let i = 0; i < peopleList.length; i++) {
            if (peopleList[i].name == this.parent1Name) {
                this.parent1 = peopleList[i];
                this.parent1.children.push(this);
            }
            if (peopleList[i].name == this.parent2Name) {
                this.parent2 = peopleList[i];
                this.parent2.children.push(this);
            }
            if (peopleList[i].name == this.spouseName) {
                this.spouse = peopleList[i];
            }
        }
    }

    displayName() {
        return this.name;
    }

    getParentsList() {
        if (!this.parent1Name) {
            if (!this.parent2Name) {
                return "";
            }
            else {
                return this.parent2Name;
            }
        }
        else {
            if (!this.parent2Name) {
                return this.parent1Name;
            }
            else {
                return this.parent1Name + ", " + this.parent2Name;
            }
        }
    }

    findPartnership(name) {
        for (let i = 0; i < this.renderPartnerships.length; i++) {
            if (this.renderPartnerships[i].person1.name == name || this.renderPartnerships[i].person2.name == name) {
                return this.renderPartnerships[i];
            }
        }
        return null;
    }
}

const layoutScaleX = 1.75;
const layoutScaleY = 1.25;

class FamilyTree {
    constructor(people) {
        this.people = people;
        this.roots = [];
        this.partnerships = [];
        this.children = [];
        this.childrenSingle = [];

        for (let i = 0; i < this.people.length; i++) {
            if (this.people[i].parent1 == null && this.people[i].parent2 == null) {
                this.roots.push(this.people[i]);
            }
        }
    }

    findPerson(name) {
        if (name == null) {
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

    _arrangeFixShifts() {
        for (let i = 0; i < this.people.length; i++) {
            let targetLoc = null;
            if (this.people[i].parent1) {
                if (this.people[i].parent2) {
                    targetLoc = this.people[i].parent1.render.getPosition().add(
                        this.people[i].parent2.render.getPosition()).divide(new Vector3(2, 2, 2));
                }
                else {
                    targetLoc = this.people[i].parent1.render.getPosition();
                }
            }
            else if (this.people[i].parent2) {
                targetLoc = this.people[i].parent2.render.getPosition();
            }
            if (!targetLoc) {
                continue;
            }
            targetLoc = new Vector3(targetLoc.x, this.people[i].render.getPosition().y, targetLoc.z);
            let success = true;
            for (let j = 0; j < this.people.length; j++) {
                if (j == i)
                    continue;
                let pPos = this.people[j].render.getPosition();
                if (Math.abs(targetLoc.x - pPos.x) < layoutScaleX * 0.9 && Math.abs(targetLoc.y - pPos.y) < layoutScaleY * 0.9) {
                    success = false;
                    break;
                }
            }
            if (success) {
                this.people[i].render.setPosition(targetLoc);
            }
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

        this._arrangeFixShifts();
        
    }

    connect(scene) {

        // Marriages
        let marriagePartners = new Set();
        for (let i = 0; i < this.people.length; i++) {
            if (this.people[i].spouse == null || marriagePartners.has(this.people[i].spouseName)) {
                continue;
            }
            this.partnerships.push(new RenderPartnership(this.people[i], this.people[i].spouse, scene, true));
            marriagePartners.add(this.people[i].spouseName);
        }

        // Non-marriage partnerships
        for (let i = 0; i < this.people.length; i++) {
            if (this.people[i].parent1 != null && this.people[i].parent2 != null
                && this.people[i].parent1.findPartnership(this.people[i].parent2Name) == null) {
                this.partnerships.push(new RenderPartnership(this.people[i].parent1, this.people[i].parent2, scene, false));
            }
        }

        // Children of partnerships
        for (let i = 0; i < this.partnerships.length; i++) {
            let children = [];
            for (let j = 0; j < this.people.length; j++) {
                if ((this.people[j].parent1Name == this.partnerships[i].person1.name
                    && this.people[j].parent2Name == this.partnerships[i].person2.name)
                    || (this.people[j].parent1Name == this.partnerships[i].person2.name
                    && this.people[j].parent2Name == this.partnerships[i].person1.name)) {
                    children.push(this.people[j]);
                }
            }
            if (children.length > 0) {
                this.children.push(new RenderChildrenList(this.partnerships[i].middle, children, scene, false));
            }
        }

        // Children of single parents
        for (let i = 0; i < this.people.length; i++) {
            let children = [];
            for (let j = 0; j < this.people.length; j++) {
                if ((this.people[j].parent1Name == this.people[i].name && this.people[j].parent2 == null)
                    || (this.people[j].parent2Name == this.people[i].name && this.people[j].parent1 == null)) {
                    children.push(this.people[j]);
                }
            }
            if (children.length > 0) {
                this.childrenSingle.push(new RenderChildrenList(this.people[i].render.getBottomConnectorLoc().clone().add(
                    new Vector3(0, -renderConnectionOffset, 0)),
                    children, scene, this.people[i].renderPartnerships.length <= 0));
            }
        }
    }

}
