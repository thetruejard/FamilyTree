
var fontWaiters = [];

var globalFont = null;
const fontLoader = new FontLoader();
fontLoader.load("https://unpkg.com/three@0.147.0/examples/fonts/gentilis_regular.typeface.json", async function(font) {
    globalFont = font;
    while (fontWaiters.length > 0) {
        fontWaiters.pop().rebuild();
    }
    await new Promise(r => setTimeout(r, 100));
    while (fontWaiters.length > 0) {
        fontWaiters.pop().rebuild();
    }
});

class RenderPerson {
    constructor(person, position) {
        this.person = person;
        this.scene = null;
        this.mainMesh = null;
        this.borderMesh = null;
        this.textMesh1 = null;
        this.textMesh2 = null;
        this.group = new THREE.Group();
        this.group.position.set(position.x, position.y, position.z);
        this.width = null;
        this.height = null;
        this.hover = false;
        
        if (globalFont !== null) {
            this.rebuild();
        }
        else {
            fontWaiters.push(this);
        }
    }

    calcDims(textWidth, textHeight) {
        const edgeBuffer = 0.1;
        return new Vector2(textWidth + 2.5 * edgeBuffer, textHeight + 2 * edgeBuffer);
    }

    rebuild() {

        if (this.scene && this.group) {
            this.scene.remove(this.group);
        }
        
        let blackMat = new THREE.MeshBasicMaterial({color: this.hover ? 0x666600 : 0x000000, side: THREE.DoubleSide});
        let whiteMat = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide});

        const textSize = 0.115;
        const textDisplacement = 0.001
        let textGeom = new TextGeometry(this.person.displayName(), {
            font: globalFont,
            size: textSize,
            height: 0,
            curveSegments: 3
        });
        this.textMesh1 = new THREE.Mesh(textGeom, blackMat);
        var bb = new THREE.Box3().setFromObject(this.textMesh1);
        this.textMesh1.position.set(-(bb.max.x - bb.min.x) / 2, -textSize * 0.35, textDisplacement);

        this.textMesh2 = this.textMesh1.clone();
        this.textMesh2.position.set((bb.max.x - bb.min.x) / 2, -textSize * 0.35, -textDisplacement);
        this.textMesh2.rotation.set(0, Math.PI, 0);

        let dims = this.calcDims(bb.max.x - bb.min.x, textSize);
        let mainGeom = new THREE.PlaneGeometry(dims.x, dims.y);

        const borderSize = 0.0075;
        let leftMesh = new THREE.Mesh(new THREE.PlaneGeometry(borderSize, dims.y));
        let rightMesh = new THREE.Mesh(new THREE.PlaneGeometry(borderSize, dims.y));
        let topMesh = new THREE.Mesh(new THREE.PlaneGeometry(dims.x + borderSize * 2, borderSize));
        let bottomMesh = new THREE.Mesh(new THREE.PlaneGeometry(dims.x + borderSize * 2, borderSize));
        leftMesh.position.set(-(dims.x + borderSize) / 2, 0);
        rightMesh.position.set((dims.x + borderSize) / 2, 0);
        topMesh.position.set(0, (dims.y + borderSize) / 2);
        bottomMesh.position.set(0, -(dims.y + borderSize) / 2);
        leftMesh.updateMatrix();
        rightMesh.updateMatrix();
        topMesh.updateMatrix();
        bottomMesh.updateMatrix();
        leftMesh.geometry.applyMatrix4(leftMesh.matrix);
        rightMesh.geometry.applyMatrix4(rightMesh.matrix);
        topMesh.geometry.applyMatrix4(topMesh.matrix);
        bottomMesh.geometry.applyMatrix4(bottomMesh.matrix);
        let merged = mergeBufferGeometries([leftMesh.geometry, rightMesh.geometry, topMesh.geometry, bottomMesh.geometry]);

        this.mainMesh = new THREE.Mesh(mainGeom, whiteMat);
        this.borderMesh = new THREE.Mesh(merged, blackMat);

        this.group.add(this.mainMesh);
        this.group.add(this.borderMesh);
        this.group.add(this.textMesh1);
        this.group.add(this.textMesh2);

        if (this.scene !== null) {
            this.addToScene(this.scene);
        }

        this.width = dims.x;
        this.height = dims.y;
    }

    addToScene(scene) {
        this.scene = scene;
        if (globalFont !== null) {
            scene.add(this.group);
        }
    }

    setHover(hover) {
        if (hover != this.hover) {
            this.hover = hover;
            if (this.scene) {
                this.rebuild();
            }
        }
    }

    setPosition(position) {
        this.group.position.copy(position);
    }

    getPosition() {
        return this.group.position.clone();
    }

    setRotation(rotation) {
        this.group.rotation.copy(rotation);
    }

    getTopConnectorLoc() {
        return new Vector3(this.group.position.x,
            this.group.position.y + this.height / 2,
            this.group.position.z);
    }

    getBottomConnectorLoc() {
        return new Vector3(this.group.position.x,
            this.group.position.y - this.height / 2,
            this.group.position.z);
    }

}

const renderConnectionOffset = 0.2;
const renderMainConnColor = 0x444444;
const renderMarriageConnColor = 0xFF4444;

class RenderConnectionSimple {
    constructor(parent, child, scene) {
        this.parent = parent;
        this.child = child;
        this.line = null;
        this.rebuild(scene);
    }

    rebuild(scene) {
        if (this.line !== null) {
            scene.remove(this.line);
        }
        const mat = new THREE.LineBasicMaterial({color: renderMainConnColor});
        const points = [];
        points.push(this.parent.render.getBottomConnectorLoc());
        points.push(this.child.render.getTopConnectorLoc());
        const geom = new BufferGeometry().setFromPoints(points);
        this.line = new THREE.Line(geom, mat);
        scene.add(this.line);
    }


}

class RenderPartnership {
    constructor(person1, person2, scene, marriage) {
        this.person1 = person1;
        this.person2 = person2;
        this.marriage = marriage;
        this.line = null;
        this.middle = null;
        this.person1.renderPartnerships.push(this);
        this.person2.renderPartnerships.push(this);
        this.rebuild(scene);
    }

    rebuild(scene) {
        if (this.line !== null) {
            scene.remove(this.line);
        }
        const mat = new THREE.LineBasicMaterial({color: (this.marriage ? renderMarriageConnColor : renderMainConnColor)});
        const points = [];
        let conn1 = this.person1.render.getBottomConnectorLoc();
        let conn2 = this.person2.render.getBottomConnectorLoc();
        if (this.person1.renderPartnerships.length <= 1) {
            points.push(conn1);
        }
        points.push(new Vector3(conn1.x, conn1.y - renderConnectionOffset, conn1.z));
        points.push(new Vector3(conn2.x, conn2.y - renderConnectionOffset, conn2.z));
        if (this.person2.renderPartnerships.length <= 1) {
            points.push(conn2);
        }
        const geom = new BufferGeometry().setFromPoints(points);
        this.line = new THREE.Line(geom, mat);
        scene.add(this.line);
        this.middle = new Vector3(
            (conn1.x + conn2.x) / 2,
            (conn1.y + conn2.y) / 2 - renderConnectionOffset,
            (conn1.z + conn2.z) / 2
        );
    }
}

class RenderChildrenList {
    constructor(parentPoint, children, scene, addStub) {
        this.parentPoint = parentPoint;
        this.children = children;
        this.addStub = addStub;
        this.mainLine = null;
        this.extraLines = [];
        this.connLine = null;
        this.rebuild(scene);
    }

    rebuild(scene) {
        if (this.mainLine != null) {
            scene.remove(this.mainLine);
        }
        for (let i = 0; i < this.extraLines.length; i++) {
            scene.remove(this.extraLines[i]);
        }
        this.extraLines = [];
        if (this.connLine != null) {
            scene.remove(this.connLine);
        }

        let ordering = [this.children[0]];
        let distPeople = function(p1, p2) {
            return p1.render.getTopConnectorLoc().distanceTo(p2.render.getTopConnectorLoc());
        }
        let dist = function(p1, p2) {
            return p1.distanceTo(p2);
        }
        while (ordering.length < this.children.length) {
            let min_dist = 1000000;
            let min_side = false;
            let min_pair = this.children[1];
            for (let i = 0; i < this.children.length; i++) {
                if (ordering.includes(this.children[i])) {
                    continue;
                }
                if (distPeople(ordering[0], this.children[i]) < min_dist) {
                    min_dist = distPeople(ordering[0], this.children[i]);
                    min_side = false;
                    min_pair = this.children[i];
                }
                else if (distPeople(ordering[ordering.length - 1], this.children[i]) < min_dist) {
                    min_dist = distPeople(ordering[ordering.length - 1], this.children[i]);
                    min_side = true;
                    min_pair = this.children[i];
                }
            }
            if (min_side) {
                ordering.push(min_pair);
            }
            else {
                ordering.unshift(min_pair);
            }
        }

        const mat = new THREE.LineBasicMaterial({color: renderMainConnColor});
        let points = [];
        for (let i = 0; i < ordering.length; i++) {
            let l = ordering[i].render.getTopConnectorLoc();
            points.push(new Vector3(l.x, l.y + renderConnectionOffset, l.z));
            
            let extraPoints = [l, points[i]];
            const geom = new BufferGeometry().setFromPoints(extraPoints);
            this.extraLines.push(new THREE.Line(geom, mat));
            scene.add(this.extraLines[i]);
        }
        let geom = new BufferGeometry().setFromPoints(points);
        this.mainLine = new THREE.Line(geom, mat);
        scene.add(this.mainLine);

        let bottomPoint = points[0];
        let min_dist = 1000000;  // Do NOT initialize; will snap when it shouldn't.
        for (let i = 0; i < points.length - 1; i++) {
            let m = new Vector3(
                (points[i].x + points[i + 1].x) / 2,
                (points[i].y + points[i + 1].y) / 2,
                (points[i].z + points[i + 1].z) / 2);
            if (dist(m, this.parentPoint) < min_dist) {
                bottomPoint = m;
                min_dist = dist(m, this.parentPoint);
            }
        }
        points = [bottomPoint, this.parentPoint];
        if (this.addStub) {
            points.push(this.parentPoint.clone().add(new Vector3(0, renderConnectionOffset, 0)));
        }
        geom = new BufferGeometry().setFromPoints(points);
        this.connLine = new THREE.Line(geom, mat);
        scene.add(this.connLine);
    }
} 



