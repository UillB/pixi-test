import {Shape, Body, ContactEquation} from 'p2';
import { PixiBody } from './PixiBody';

export interface BeginContactEvent {
    type: "beginContact",
    bodyA: PixiBody;
    bodyB: PixiBody;
    shapeA: Shape;
    shapeB: Shape;
    contactEquations: ContactEquation[];
}