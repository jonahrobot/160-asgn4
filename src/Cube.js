class Cube {
    constructor() {
        this.type = 'cube';

        this.color = [1.0, 1.0, 1.0, 1.0];

        this.matrix = new Matrix4();
        this.textureNum = 0;
    }
    render() {

        var rgba = this.color;

        gl.uniform1i(u_whichTexture,this.textureNum);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var allverts=[];
        var alluv=[];
        var allNormal=[];

        // Front face
        allverts = allverts.concat([0,0,0,  1,1,0,   1,0,0]);
        alluv = alluv.concat([0,0, 1,1, 1,0]);
        allNormal = allNormal.concat([0,0,-1,  0,0,-1,  0,0,-1]);
        
        allverts = allverts.concat([0,0,0,  0,1,0,   1,1,0]);
        alluv = alluv.concat([0,0, 0,1, 1,1]);
        allNormal = allNormal.concat([0,0,-1,  0,0,-1,  0,0,-1]);

        //gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);

        // Top face
        allverts = allverts.concat([0,1,0,  0,1,1,   1,1,1]);
        alluv = alluv.concat([0,0, 0,1, 1,1]);
        allNormal = allNormal.concat([0,1,0,  0,1,0,  0,1,0]);

        allverts = allverts.concat([0,1,0,  1,1,1,   1,1,0]);
        alluv = alluv.concat([0,0, 1,1, 1,0]);
        allNormal = allNormal.concat([0,1,0,  0,1,0,  0,1,0]);

        // gl.uniform4f(u_FragColor, rgba[0] * 0.7, rgba[1] * 0.7, rgba[2] * 0.7, rgba[3]);

        // Right face
        allverts = allverts.concat([1,0,0,  1,1,1,   1,0,1]);
        alluv = alluv.concat([0,0, 1,1, 1,0]);
        allNormal = allNormal.concat([1,0,0,  1,0,0,  1,0,0]);

        
        allverts = allverts.concat([1,0,0,  1,1,0,   1,1,1]);
        alluv = alluv.concat([0,0, 0,1, 1,1]);
        allNormal = allNormal.concat([1,0,0,  1,0,0,  1,0,0]);

        // Left face
        allverts = allverts.concat([0,1,1,  0,1,0,   0,0,1]);
        alluv = alluv.concat([0,1, 1,1, 0,0]);
        allNormal = allNormal.concat([-1,0,0,  -1,0,0,  -1,0,0]);

        allverts = allverts.concat([0,1,0,  0,0,0,   0,0,1]);
        alluv = alluv.concat([1,1, 1,0, 0,0]);
        allNormal = allNormal.concat([-1,0,0,  -1,0,0,  -1,0,0]);

        // Back face
        allverts = allverts.concat([0,0,1,  1,0,1,   1,1,1]);
        alluv = alluv.concat([1,0, 0,0, 0,1]);
        allNormal = allNormal.concat([0,0,1,  0,0,1,  0,0,1]);

        allverts = allverts.concat([0,0,1,  1,1,1,   0,1,1]);
        alluv = alluv.concat([1,0, 0,1, 1,1]);
        allNormal = allNormal.concat([0,0,1,  0,0,1,  0,0,1]);

        // Bottom Face
        allverts = allverts.concat([0,0,1,  1,0,0,   1,0,1]);
        alluv = alluv.concat([0,0, 1,1, 1,0]);
        allNormal = allNormal.concat([0,-1,0,  0,-1,0,  0,-1,0]);

        allverts = allverts.concat([0,0,1,  0,0,0,   1,0,0]);
        alluv = alluv.concat([0,0, 0,1, 1,1]);
        allNormal = allNormal.concat([0,-1,0,  0,-1,0,  0,-1,0]);
        
        drawTriangle3DUVNormal(allverts,alluv,allNormal);
    }
}
