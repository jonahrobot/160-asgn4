class Camera{
    constructor() {
        this.fov = 60;
        this.eye = new Vector3([0,4,10]);
        this.at = new Vector3([0,-20,-100]);
        this.up =  new Vector3([0,1,0]);
        this.viewMatrix = new Matrix4();

        this.speed = 0.25;
    }

    moveForward(){

        var forward = new Vector3();
        forward.set(this.at)

        forward = forward.sub(this.eye);

        forward.normalize();

        forward.mul(this.speed);

        this.eye.add(forward);
        this.at.add(forward);
    }

    moveBackwards(){

        var back = new Vector3();
        back.set(this.eye)

        back = back.sub(this.at);

        back.normalize();

        back.mul(this.speed);

        this.eye.add(back);
        this.at.add(back);
    }

    moveLeft(){
        var forward = new Vector3();
        forward.set(this.at)

        forward = forward.sub(this.eye);

        var side = Vector3.cross(this.up,forward);
        side.normalize();
        side.mul(this.speed);

        this.eye.add(side);
        this.at.add(side);
    }

    moveRight(){
        var forward = new Vector3();
        forward.set(this.at)

        forward = forward.sub(this.eye);

        var side = Vector3.cross(forward,this.up);
        side.normalize();
        side.mul(this.speed);

        this.eye.add(side);
        this.at.add(side);
    }

    panHorizontal(x){
        var forward = new Vector3();
        forward.set(this.at)

        forward = forward.sub(this.eye);

        var rotMatrix = new Matrix4();
        rotMatrix.setRotate(x,this.up.elements[0],this.up.elements[1],this.up.elements[2]);

        var f_prime = rotMatrix.multiplyVector3(forward);

        this.at.set(this.eye);
        this.at.add(f_prime);
    }

    panVertical(y){
        var forward = new Vector3();
        forward.set(this.at)

        forward = forward.sub(this.eye);


        var side = Vector3.cross(forward,this.up);
        side.normalize();

        var rotMatrix = new Matrix4();
        rotMatrix.setRotate(y,side.elements[0],side.elements[1],side.elements[2]);

        var f_prime = rotMatrix.multiplyVector3(forward);

        this.at.set(this.eye);
        this.at.add(f_prime);
    }

}