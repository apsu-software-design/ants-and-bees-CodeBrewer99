import {AntColony, Place} from './game';
/**
 * This is an insect abstraction object for an insect
 */
export abstract class Insect {
  readonly name:string;
/**
 * Creates a new abstract insect
 * 
 * @param armor armor strength
 * @param place tile on which the insect sits
 */
  constructor(protected armor:number, protected place:Place){}

  getName():string { return this.name; }
  getArmor():number { return this.armor; }
  getPlace() { return this.place; }
  setPlace(place:Place){ this.place = place; }
/**
 * This fuction subtracts damage from an insects armor and deletes the insect if armor health reaches 0
 * 
 * @param amount reduces the amount of armor by this amount
 * @returns true if the insects armor is less than or equal to 0, false if armor is above 0
 */
  reduceArmor(amount:number):boolean {
    this.armor -= amount;
    if(this.armor <= 0){
      console.log(this.toString()+' ran out of armor and expired');
      this.place.removeInsect(this);
      return true;
    }
    return false;
  }

  abstract act(colony?:AntColony):void;

  toString():string {
    return this.name + '('+(this.place ? this.place.name : '')+')';
  }
}

/**
 * Class to represent a Bee
 */
export class Bee extends Insect {
  readonly name:string = 'Bee';
  private status:string;
/**
 * 
 * @param armor number to represent armor strength
 * @param damage number to reduce armor
 * @param place tile on which the bee is located
 */
  constructor(armor:number, private damage:number, place?:Place){
    super(armor, place);
  }
/**
 * This fuction stings an ant
 * 
 * @param ant ant that is getting stung
 * @returns true or false depending on the ant armor
 */
  sting(ant:Ant):boolean{
    console.log(this+ ' stings '+ant+'!');
    return ant.reduceArmor(this.damage);
  }

 /**
  * This function test to see if an ant is being blocked by a guard ant
  * 
  * @returns true if ant is being blocked, false if not
  */
  isBlocked():boolean {
    return this.place.getAnt() !== undefined;
  }

  setStatus(status:string) { this.status = status; }
/**
 * This function stings the guarding ant, or moves the bee forward unless stuck, and sets the status of bee to default
 */
  act() {
    if(this.isBlocked()){
      if(this.status !== 'cold') {
        this.sting(this.place.getAnt());
      }
    }
    else if(this.armor > 0) {
      if(this.status !== 'stuck'){
        this.place.exitBee(this);
      }
    }    
    this.status = undefined;
  }
}

/**
 * Abstraction class for a default ant
 */
export abstract class Ant extends Insect {
  protected boost:string;
  /**
   * 
   * @param armor represents armor strength
   * @param foodCost represents how much food an ant costs per turn
   * @param place represents the tile on which an ant is located
   */
  constructor(armor:number, private foodCost:number = 0, place?:Place) {
    super(armor, place);
  }

  getFoodCost():number { return this.foodCost; }
/**
 * Gives the user a boosts to use
 * 
 * @param boost string to represent what type of boost
 */
  setBoost(boost:string) { 
    this.boost = boost; 
      console.log(this.toString()+' is given a '+boost);
  }
}

/**
 * This class represents a grower ant
 * 
 */
export class GrowerAnt extends Ant {
  readonly name:string = "Grower";
  constructor() {
    super(1,1)
  }
/**
 * This function adds food or boosts to an ant colony determined by chance
 * 
 * @param colony colony this grower ant belongs to
 */
  act(colony:AntColony) {
    let roll = Math.random();
    if(roll < 0.6){
      colony.increaseFood(1);
    } else if(roll < 0.7) {
      colony.addBoost('FlyingLeaf');
    } else if(roll < 0.8) {
      colony.addBoost('StickyLeaf');
    } else if(roll < 0.9) {
      colony.addBoost('IcyLeaf');
    } else if(roll < 0.95) {
      colony.addBoost('BugSpray');
    }
  }  
}

/**
 * This class represent a thrower ant object
 */
export class ThrowerAnt extends Ant {
  readonly name:string = "Thrower";
  private damage:number = 1;

  constructor() {
    super(1,4);
  }
/**
 * Performs the actions for the thrower ant
 */
  act() {
    if(this.boost !== 'BugSpray'){
      let target;
      if(this.boost === 'FlyingLeaf')
        target = this.place.getClosestBee(5);
      else
        target = this.place.getClosestBee(3);

      if(target){
        console.log(this + ' throws a leaf at '+target);
        target.reduceArmor(this.damage);
    
        if(this.boost === 'StickyLeaf'){
          target.setStatus('stuck');
          console.log(target + ' is stuck!');
        }
        if(this.boost === 'IcyLeaf') {
          target.setStatus('cold');
          console.log(target + ' is cold!');
        }
        this.boost = undefined;
      }
    }
    else {
      console.log(this + ' sprays bug repellant everywhere!');
      let target = this.place.getClosestBee(0);
      while(target){
        target.reduceArmor(10);
        target = this.place.getClosestBee(0);
      }
      this.reduceArmor(10);
    }
  }
}

/**
 * This class represent an eater ant object
 */
export class EaterAnt extends Ant {
  readonly name:string = "Eater";
  private turnsEating:number = 0;
  private stomach:Place = new Place('stomach');
  constructor() {
    super(2,4)
  }
/**
 * This function test if an eater ant has eaten a bee or not
 * 
 * @returns true if the eater ant has already eaten a bee
 */
  isFull():boolean {
    return this.stomach.getBees().length > 0;
  }
/**
 * This function performs the actions for an eater ant
 */
  act() {
    console.log("eating: "+this.turnsEating);
    if(this.turnsEating == 0){
      console.log("try to eat");
      let target = this.place.getClosestBee(0);
      if(target) {
        console.log(this + ' eats '+target+'!');
        this.place.removeBee(target);
        this.stomach.addBee(target);
        this.turnsEating = 1;
      }
    } else {
      if(this.turnsEating > 3){
        this.stomach.removeBee(this.stomach.getBees()[0]);
        this.turnsEating = 0;
      } 
      else 
        this.turnsEating++;
    }
  }  
/**
 * This function subtracts armor from the eater ant
 * 
 * @param amount number to subtract from armor
 * @returns true if armor is less than or equal to 0, return false if armor is greater than 0
 */
  reduceArmor(amount:number):boolean {
    this.armor -= amount;
    console.log('armor reduced to: '+this.armor);
    if(this.armor > 0){
      if(this.turnsEating == 1){
        let eaten = this.stomach.getBees()[0];
        this.stomach.removeBee(eaten);
        this.place.addBee(eaten);
        console.log(this + ' coughs up '+eaten+'!');
        this.turnsEating = 3;
      }
    }
    else if(this.armor <= 0){
      if(this.turnsEating > 0 && this.turnsEating <= 2){
        let eaten = this.stomach.getBees()[0];
        this.stomach.removeBee(eaten);
        this.place.addBee(eaten);
        console.log(this + ' coughs up '+eaten+'!');
      }
      return super.reduceArmor(amount);
    }
    return false;
  }
}

/**
 * This class represents a scuba ant object
 */
export class ScubaAnt extends Ant {
  readonly name:string = "Scuba";
  private damage:number = 1;

  constructor() {
    super(1,5)
  }
/**
 * This method performs the actions for a scuba ant
 */
  act() {
    if(this.boost !== 'BugSpray'){
      let target;
      if(this.boost === 'FlyingLeaf')
        target = this.place.getClosestBee(5);
      else
        target = this.place.getClosestBee(3);

      if(target){
        console.log(this + ' throws a leaf at '+target);
        target.reduceArmor(this.damage);
    
        if(this.boost === 'StickyLeaf'){
          target.setStatus('stuck');
          console.log(target + ' is stuck!');
        }
        if(this.boost === 'IcyLeaf') {
          target.setStatus('cold');
          console.log(target + ' is cold!');
        }
        this.boost = undefined;
      }
    }
    else {
      console.log(this + ' sprays bug repellant everywhere!');
      let target = this.place.getClosestBee(0);
      while(target){
        target.reduceArmor(10);
        target = this.place.getClosestBee(0);
      }
      this.reduceArmor(10);
    }
  }
}

/**
 * This class represents a guard ant object
 */
export class GuardAnt extends Ant {
  readonly name:string = "Guard";

  constructor() {
    super(2,4)
  }

  getGuarded():Ant {
    return this.place.getGuardedAnt();
  }

  act() {}
}
