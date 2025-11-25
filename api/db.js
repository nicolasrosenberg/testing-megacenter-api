/**
 * DB
 */

const { MongoClient, ObjectId } = require('mongodb')

module.exports = async host => ({

	// client instance
	DB: (await MongoClient.connect(host, { useNewUrlParser: true, useUnifiedTopology: true })).db(),

	// methods
	async findOne(coll, query) {

		// id query shortcut
		if (typeof query == "string" && ObjectId.isValid(query)) query = { _id: ObjectId(query) }

		return await this.DB.collection(coll).findOne(query)
	}
})
