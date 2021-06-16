import mingo from "mingo";
import { RawObject } from "mingo/util";
import { IIndiceOption, IndiceType, Schema } from "schema";


export class Db {
    private schema: Schema;
    constructor(schema: Schema){
        this.schema = schema;
    }
    find(criteria?: RawObject, sort?: RawObject, skip?: number, limit?: number){
        const primaryIndice = this.schema.indices.find(i=> i.type===IndiceType.PRIMARY);
        let fieldFilterIndices: IIndiceOption[] = [];
        let fieldSortIndices: IIndiceOption[] = [];
        let fullTextIndice;
        if(criteria){
             fullTextIndice = this.schema.indices.filter(i=> i.type===IndiceType.GLOBAL && criteria['$text'])
             .map(i=>({...i, value: criteria['$text'], op: '$eq'}))
             .pop();
             fieldFilterIndices = this.schema
             .indices
             .filter(i=> this.isSimpleIndex(i) && criteria[i.path!])
             .map(i=>({...i, value: criteria[i.path!], op: '$eq'}));
        }
        if(sort){
             fieldSortIndices = this.schema.indices.filter(i=> (i.type===IndiceType.LOCAL || i.type===IndiceType.PRIMARY) && sort[i.path!]);
        }
        return {
            [Symbol.asyncIterator](){
                
                return {
                    ids: null,
                    async next() { 
                        if(!ids){}
                        if(fieldFilterIndices.length){
                            const ids: any[][] = await Promise.all(fieldFilterIndices.map(o=> o.indice.find(o.value)));
                        }
                        if (this.current <= this.last) {
                          return { done: false, value: this.current++ };
                        } else {
                          return { done: true };
                        }
                      }
                }
            }
        }
    }


    private isSimpleIndex(i: IIndiceOption) {
        return (i.type === IndiceType.LOCAL || i.type === IndiceType.PRIMARY);
    }
} 
const collection = [];
const query = new mingo.Query({ score: { $gt: 10 } });
let cursor = query.find(collection);
query._compile()

// sort, skip and limit by chaining
cursor.sort({student_id: 1, score: -1})
  .skip(100)
  .limit(100)

  for (let value of cursor) {
    console.log(value)
  }