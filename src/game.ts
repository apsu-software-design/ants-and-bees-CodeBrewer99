import {Insect, Bee, Ant, GrowerAnt, ThrowerAnt, EaterAnt, ScubaAnt, GuardAnt} from './ants';
/**
 * This class represents the place of an insect
 */
class Place {
  protected ant:Ant;
  protected guard:GuardAnt;
  protected bees:Bee[] = [];
/**
 * Constructor creates a place that an insect can exist
 * 
 * @param name string parameter to determine the name of the place
 * @param water boolean parameter to determine if there is water on this place
 * @param exit optional parameter that tells what place an insect should exit
 * @param entrance optional parameter that tells what place an insect should enter
 */
  constructor(readonly name:string,
              protected readonly water = false,
              private exit?:Place, 
              private entrance?:Place) {}

  getExit():Place { return this.exit; }

  setEntrance(place:Place){ this.entrance = place; }

  isWater():boolean { return this.water; }
/**
 * Getter method that gets the guard ant on this place or the ant if guard ant does not exist
 * 
 * @returns guard ant or ant on this place
 */
  getAnt():Ant { 
    if(this.guard) 
      return this.guard;
    else 
      return this.ant;
  }

  getGuardedAnt():Ant {
    return this.ant;
  }

  getBees():Bee[] { return this.bees; }
/**
 * Gets the bee closest to this place
 * 
 * @param maxDistance 
 * @param minDistance 
 * @returns 
 */
  getClosestBee(maxDistance:number, minDistance:number = 0):Bee {
		let p:Place = this;
		for(let dist = 0; p!==undefined && dist <= maxDistance; dist++) {
			if(dist >= minDistance && p.bees.length > 0) {
				return p.bees[0];
      }
			p = p.entrance;
		}
		return undefined;
  }

  /**
   * This function adds an ant to this place
   * 
   * @param ant type of ant to be added to this place
   * @returns true if an ant can be placed here
   */
  addAnt(ant:Ant):boolean {
    if(ant instanceof GuardAnt) {
      if(this.guard === undefined){
        this.guard = ant;
        this.guard.setPlace(this);
        return true;
      }
    }
    else 
      if(this.ant === undefined) {
        this.ant = ant;
        this.ant.setPlace(this);
        return true;
      }
    return false;
  }
/**
 * This function removes an ant from this place
 * 
 * @returns the type of ant removed 
 */
  removeAnt():Ant {
    if(this.guard !== undefined){
      let guard = this.guard;
      this.guard = undefined;
      return guard;
    }
    else {
      let ant = this.ant;
      this.ant = undefined;
      return ant;
    }
  }
/**
 * Adds a bee to this place
 * 
 * @param bee object to be added to this place
 */
  addBee(bee:Bee):void {
    this.bees.push(bee);
    bee.setPlace(this);
  }
/**
 * Removes a bee from this tile
 * 
 * @param bee object to be removed from this place
 */
  removeBee(bee:Bee):void {
    var index = this.bees.indexOf(bee);
    if(index >= 0){
      this.bees.splice(index,1);
      bee.setPlace(undefined);
    }
  }
/**
 * Removes all bees 
 */
  removeAllBees():void {
    this.bees.forEach((bee) => bee.setPlace(undefined) );
    this.bees = [];
  }
/**
 * Removes bee from this place and adds be to exit place
 * 
 * @param bee object to exit place
 */
  exitBee(bee:Bee):void {
    this.removeBee(bee);
    this.exit.addBee(bee);  
  }
/**
 * Removes any insect from this place
 * 
 * @param insect insect to be removed
 */
  removeInsect(insect:Insect) {
    if(insect instanceof Ant){
      this.removeAnt();
    }
    else if(insect instanceof Bee){
      this.removeBee(insect);
    }
  }
/**
 * This function gives water its properties
 */
  act() {
    if(this.water){
      if(this.guard){
        this.removeAnt();
      }
      if(!(this.ant instanceof ScubaAnt)){
        this.removeAnt();
      }
    }
  }
}

/**
 * This class represents a Hive object
 */
class Hive extends Place {
  private waves:{[index:number]:Bee[]} = {}
/**
 * Constructor that creates a new hive
 * 
 * @param beeArmor number that describes how much armor a bee from the hive has
 * @param beeDamage number that describes how much damage a bee from the hive can do
 */
  constructor(private beeArmor:number, private beeDamage:number){
    super('Hive');
  }
/**
 * This function adds a new wave of bees to the hive
 * 
 * @param attackTurn represents the turn in which the hive is sent to attack
 * @param numBees represents the number of bees to add to hive
 * @returns this hive
 */
  addWave(attackTurn:number, numBees:number):Hive {
    let wave:Bee[] = [];
    for(let i=0; i<numBees; i++) {
      let bee = new Bee(this.beeArmor, this.beeDamage, this);
      this.addBee(bee);
      wave.push(bee);
    }
    this.waves[attackTurn] = wave;
    return this;
  }
  /**
   * This function sends a wave of bees to attack an ant colony
   * 
   * @param colony represents the ant colony that is being invaded
   * @param currentTurn represents the current turn
   * @returns the wave of bees on the current turn
   */
  invade(colony:AntColony, currentTurn:number): Bee[]{
    if(this.waves[currentTurn] !== undefined) {
      this.waves[currentTurn].forEach((bee) => {
        this.removeBee(bee);
        let entrances:Place[] = colony.getEntrances();
        let randEntrance:number = Math.floor(Math.random()*entrances.length);
        entrances[randEntrance].addBee(bee);
      });
      return this.waves[currentTurn];
    }
    else{
      return [];
    }    
  }
}

/**
 * This class represents a colony of ants and stores the data
 */
class AntColony {
  private food:number;
  private places:Place[][] = [];
  private beeEntrances:Place[] = [];
  private queenPlace:Place = new Place('Ant Queen');
  private boosts:{[index:string]:number} = {'FlyingLeaf':1,'StickyLeaf':1,'IcyLeaf':1,'BugSpray':0}
/**
 * Constructor creates a new ant colony
 * 
 * @param startingFood parameter represents the amount of starting food of an ant colony
 * @param numTunnels parameter represents the number of tunnels of an ant colony
 * @param tunnelLength parameter represents the length of a tunnel in an ant colony
 * @param moatFrequency parameter represents the frequency of the moat
 */
  constructor(startingFood:number, numTunnels:number, tunnelLength:number, moatFrequency=0){
    this.food = startingFood;
//Places tunnels and moats at all the appropriate places
    let prev:Place;
		for(let tunnel=0; tunnel < numTunnels; tunnel++)
		{
			let curr:Place = this.queenPlace;
      this.places[tunnel] = [];
			for(let step=0; step < tunnelLength; step++)
			{
        let typeName = 'tunnel';
        if(moatFrequency !== 0 && (step+1)%moatFrequency === 0){
          typeName = 'water';
				}
				
				prev = curr;
        let locationId:string = tunnel+','+step;
        curr = new Place(typeName+'['+locationId+']', typeName=='water', prev);
        prev.setEntrance(curr);
				this.places[tunnel][step] = curr;
			}
			this.beeEntrances.push(curr);
		}
  }

  getFood():number { return this.food; }

  increaseFood(amount:number):void { this.food += amount; }

  getPlaces():Place[][] { return this.places; }

  getEntrances():Place[] { return this.beeEntrances; }

  getQueenPlace():Place { return this.queenPlace; }

  queenHasBees():boolean { return this.queenPlace.getBees().length > 0; }

  getBoosts():{[index:string]:number} { return this.boosts; }
/**
 * Adds a boosts to the ant colony 
 * 
 * @param boost string that sets the boosts type
 */
  addBoost(boost:string){
    if(this.boosts[boost] === undefined){
      this.boosts[boost] = 0;
    }
    this.boosts[boost] = this.boosts[boost]+1;
    console.log('Found a '+boost+'!');
  }
/**
 * This function deploys an ant to the ant colony
 * 
 * @param ant gives the ant being deployed its type
 * @param place determines where the ant will be placed
 * @returns undefined if ant is deployed, or returns string 'tunnel already occupied', or 'not enough food'
 */
  deployAnt(ant:Ant, place:Place):string {
    if(this.food >= ant.getFoodCost()){
      let success = place.addAnt(ant);
      if(success){
        this.food -= ant.getFoodCost();
        return undefined;
      }
      return 'tunnel already occupied';
    }
    return 'not enough food';
  }

  removeAnt(place:Place){
    place.removeAnt();
  }
/**
 * This function applies boosts to a place
 *  
 * @param boost string of boosts to be applied
 * @param place place where the boosts can be applied
 * @returns string 'no such boosts', 'no ant at location', or undefined
 */
  applyBoost(boost:string, place:Place):string {
    if(this.boosts[boost] === undefined || this.boosts[boost] < 1) {
      return 'no such boost';
    }
    let ant:Ant = place.getAnt();
    if(!ant) {
      return 'no Ant at location' 
    }
    ant.setBoost(boost);
    return undefined;
  }
/**
 * This function performs all actions for each ant during a turn
 */
  antsAct() {
    this.getAllAnts().forEach((ant) => {
      if(ant instanceof GuardAnt) {
        let guarded = ant.getGuarded();
        if(guarded)
          guarded.act(this);
      }
      ant.act(this);
    });    
  }
/**
 * This function performs actions for a bee
 */
  beesAct() {
    this.getAllBees().forEach((bee) => {
      bee.act();
    });
  }
/**
 * This function determines what actions will occur on the places
 */
  placesAct() {
    for(let i=0; i<this.places.length; i++) {
      for(let j=0; j<this.places[i].length; j++) {
        this.places[i][j].act();
      }
    }    
  }
/**
 * This function gets all the ants in the colony
 * 
 * @returns all ants in the colony
 */
  getAllAnts():Ant[] {
    let ants = [];
    for(let i=0; i<this.places.length; i++) {
      for(let j=0; j<this.places[i].length; j++) {
        if(this.places[i][j].getAnt() !== undefined) {
          ants.push(this.places[i][j].getAnt());
        }
      }
    }
    return ants;
  }
/**
 * This function gets all the bees in a colony
 * 
 * @returns all the bees in a colony
 */
  getAllBees():Bee[] {
    var bees = [];
    for(var i=0; i<this.places.length; i++){
      for(var j=0; j<this.places[i].length; j++){
        bees = bees.concat(this.places[i][j].getBees());
      }
    }
    return bees;
  }
}

/**
 * This class represents an antgame object which is a wrapper class for all the actions that occur during the game
 */
class AntGame {
  private turn:number = 0;
  /**
   * Constructor creates a new game
   * 
   * @param colony determines which colony is being used
   * @param hive determines which hive is being used for the game
   */
  constructor(private colony:AntColony, private hive:Hive){}
/**
 * This function simulates taking a turn in the game
 */
  takeTurn() {
    console.log('');
    this.colony.antsAct();
    this.colony.beesAct();
    this.colony.placesAct();
    this.hive.invade(this.colony, this.turn);
    this.turn++;
    console.log('');
  }

  getTurn() { return this.turn; }
/**
 * This function test to see if the game has been won yet
 * 
 * @returns true if all bees are defeated, false if the queen still has bees, undefined otherwise
 */
  gameIsWon():boolean|undefined {
    if(this.colony.queenHasBees()){
      return false;
    }
    else if(this.colony.getAllBees().length + this.hive.getBees().length === 0) {
      return true;
    }   
    return undefined;
  }
/**
 * This function deploys an ant
 * 
 * @param antType string to define the type of ant to deploy
 * @param placeCoordinates string determines which place to deploy an ant
 * @returns 'unknown ant type' if none of the ants match
 */
  deployAnt(antType:string, placeCoordinates:string):string {
    let ant;
    switch(antType.toLowerCase()) {
      case "grower":
        ant = new GrowerAnt(); break;
      case "thrower":
        ant = new ThrowerAnt(); break;
      case "eater":
        ant = new EaterAnt(); break;
      case "scuba":
        ant = new ScubaAnt(); break;
      case "guard":
        ant = new GuardAnt(); break;
      default:
        return 'unknown ant type';
    }
/**
 * Deploys an ant if valid coordinates, throws exception of not
 */
    try {
      let coords = placeCoordinates.split(',');
      let place:Place = this.colony.getPlaces()[coords[0]][coords[1]];
      return this.colony.deployAnt(ant, place);
    } catch(e) {
      return 'illegal location';
    }
  }
/**
 * This function removes an ant
 * 
 * @param placeCoordinates string that determines where the ant will be removed from
 * @returns undefined or throws exception 'illegal location'
 */
  removeAnt(placeCoordinates:string):string {
    try {
      let coords = placeCoordinates.split(',');
      let place:Place = this.colony.getPlaces()[coords[0]][coords[1]];
      place.removeAnt();
      return undefined;
    }catch(e){
      return 'illegal location';
    }    
  }
/**
 * this function applies a boost to ant ant
 * 
 * @param boostType string that determines the type of boost
 * @param placeCoordinates string that determines where to place the boost
 * @returns applyboost or throws 'illegal location' error
 */
  boostAnt(boostType:string, placeCoordinates:string):string {
    try {
      let coords = placeCoordinates.split(',');
      let place:Place = this.colony.getPlaces()[coords[0]][coords[1]];
      return this.colony.applyBoost(boostType,place);
    }catch(e){
      return 'illegal location';
    }    
  }

  getPlaces():Place[][] { return this.colony.getPlaces(); }
  getFood():number { return this.colony.getFood(); }
  getHiveBeesCount():number { return this.hive.getBees().length; }
  getBoostNames():string[] { 
    let boosts = this.colony.getBoosts();
    return Object.keys(boosts).filter((boost:string) => {
      return boosts[boost] > 0;
    }); 
  }
}

export { AntGame, Place, Hive, AntColony }