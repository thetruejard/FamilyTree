
var fontWaiters = [];

var globalFont = null;
const fontLoader = new FontLoader();
fontLoader.load("https://unpkg.com/three@0.147.0/examples/fonts/gentilis_regular.typeface.json", async function(font) {
    globalFont = font;
    while (fontWaiters.length > 0) {
        fontWaiters.pop().build();
    }
    await new Promise(r => setTimeout(r, 100));
    while (fontWaiters.length > 0) {
        fontWaiters.pop().build();
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
        
        if (globalFont !== null) {
            this.build();
        }
        else {
            fontWaiters.push(this);
        }
    }

    calcDims(textWidth, textHeight) {
        const edgeBuffer = 0.1;
        return new Vector2(textWidth + 2.5 * edgeBuffer, textHeight + 2 * edgeBuffer);
    }

    build() {
        
        let blackMat = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide});
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

        const borderSize = 0.005;
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
    }

    addToScene(scene) {
        this.scene = scene;
        if (globalFont !== null) {
            scene.add(this.group);
        }
    }

    setPosition(position) {
        this.group.position.set(position);
    }

    setRotation(rotation) {
        this.group.rotation.set(rotation);
    }

}