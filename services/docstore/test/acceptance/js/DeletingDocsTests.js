/* eslint-disable
    camelcase,
    handle-callback-err,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chai = require('chai')
chai.should()
const { db, ObjectId } = require('../../../app/js/mongodb')
const { expect } = chai
const DocstoreApp = require('./helpers/DocstoreApp')
const Errors = require('../../../app/js/Errors')
const Settings = require('settings-sharelatex')

const DocstoreClient = require('./helpers/DocstoreClient')

function deleteTestSuite(deleteDoc) {
  beforeEach(function (done) {
    this.project_id = ObjectId()
    this.doc_id = ObjectId()
    this.lines = ['original', 'lines']
    this.version = 42
    this.ranges = []
    return DocstoreApp.ensureRunning(() => {
      return DocstoreClient.createDoc(
        this.project_id,
        this.doc_id,
        this.lines,
        this.version,
        this.ranges,
        (error) => {
          if (error != null) {
            throw error
          }
          return done()
        }
      )
    })
  })

  it('should show as not deleted on /deleted', function (done) {
    DocstoreClient.isDocDeleted(
      this.project_id,
      this.doc_id,
      (error, res, body) => {
        if (error) return done(error)
        expect(res.statusCode).to.equal(200)
        expect(body).to.have.property('deleted').to.equal(false)
        done()
      }
    )
  })

  describe('when the doc exists', function () {
    beforeEach(function (done) {
      deleteDoc(this.project_id, this.doc_id, (error, res, doc) => {
        this.res = res
        return done()
      })
    })

    afterEach(function (done) {
      return db.docs.remove({ _id: this.doc_id }, done)
    })

    it('should mark the doc as deleted on /deleted', function (done) {
      DocstoreClient.isDocDeleted(
        this.project_id,
        this.doc_id,
        (error, res, body) => {
          if (error) return done(error)
          expect(res.statusCode).to.equal(200)
          expect(body).to.have.property('deleted').to.equal(true)
          done()
        }
      )
    })

    it('should insert a deleted doc into the docs collection', function (done) {
      return db.docs.find({ _id: this.doc_id }).toArray((error, docs) => {
        docs[0]._id.should.deep.equal(this.doc_id)
        docs[0].lines.should.deep.equal(this.lines)
        docs[0].deleted.should.equal(true)
        return done()
      })
    })

    it('should not export the doc to s3', function (done) {
      setTimeout(() => {
        DocstoreClient.getS3Doc(this.project_id, this.doc_id, (error) => {
          expect(error).to.be.instanceOf(Errors.NotFoundError)
          done()
        })
      }, 1000)
    })
  })

  describe('when archiveOnSoftDelete is enabled', function () {
    let archiveOnSoftDelete
    beforeEach('overwrite settings', function () {
      archiveOnSoftDelete = Settings.docstore.archiveOnSoftDelete
      Settings.docstore.archiveOnSoftDelete = true
    })
    afterEach('restore settings', function () {
      Settings.docstore.archiveOnSoftDelete = archiveOnSoftDelete
    })

    beforeEach('delete Doc', function (done) {
      deleteDoc(this.project_id, this.doc_id, (error, res) => {
        this.res = res
        done()
      })
    })

    beforeEach(function waitForBackgroundFlush(done) {
      setTimeout(done, 500)
    })

    afterEach(function cleanupDoc(done) {
      db.docs.remove({ _id: this.doc_id }, done)
    })

    it('should set the deleted flag in the doc', function (done) {
      db.docs.findOne({ _id: this.doc_id }, (error, doc) => {
        if (error) {
          return done(error)
        }
        expect(doc.deleted).to.equal(true)
        done()
      })
    })

    it('should set inS3 and unset lines and ranges in the doc', function (done) {
      db.docs.findOne({ _id: this.doc_id }, (error, doc) => {
        if (error) {
          return done(error)
        }
        expect(doc.lines).to.not.exist
        expect(doc.ranges).to.not.exist
        expect(doc.inS3).to.equal(true)
        done()
      })
    })

    it('should set the doc in s3 correctly', function (done) {
      DocstoreClient.getS3Doc(this.project_id, this.doc_id, (error, s3_doc) => {
        if (error) {
          return done(error)
        }
        expect(s3_doc.lines).to.deep.equal(this.lines)
        expect(s3_doc.ranges).to.deep.equal(this.ranges)
        done()
      })
    })
  })

  describe('when the doc exists in another project', function () {
    const otherProjectId = ObjectId()

    it('should show as not existing on /deleted', function (done) {
      DocstoreClient.isDocDeleted(otherProjectId, this.doc_id, (error, res) => {
        if (error) return done(error)
        expect(res.statusCode).to.equal(404)
        done()
      })
    })

    it('should return a 404 when trying to delete', function (done) {
      deleteDoc(otherProjectId, this.doc_id, (error, res) => {
        if (error) return done(error)
        expect(res.statusCode).to.equal(404)
        done()
      })
    })
  })

  return describe('when the doc does not exist', function () {
    it('should show as not existing on /deleted', function (done) {
      const missing_doc_id = ObjectId()
      DocstoreClient.isDocDeleted(
        this.project_id,
        missing_doc_id,
        (error, res) => {
          if (error) return done(error)
          expect(res.statusCode).to.equal(404)
          done()
        }
      )
    })

    return it('should return a 404', function (done) {
      const missing_doc_id = ObjectId()
      deleteDoc(this.project_id, missing_doc_id, (error, res, doc) => {
        res.statusCode.should.equal(404)
        return done()
      })
    })
  })
}

describe('Delete via DELETE', function () {
  deleteTestSuite(DocstoreClient.deleteDocLegacy)
})

describe('Delete via PATCH', function () {
  deleteTestSuite(DocstoreClient.deleteDoc)

  describe('deleting a doc twice', function () {
    beforeEach('perform 1st DELETE request', function (done) {
      DocstoreClient.deleteDoc(this.project_id, this.doc_id, done)
    })

    beforeEach('get doc before 2nd DELETE request', function (done) {
      db.docs.find({ _id: this.doc_id }).toArray((error, docs) => {
        if (error) return done(error)
        this.docBefore = docs[0]
        if (!this.docBefore) return done(new Error('doc not found'))
        done()
      })
    })

    beforeEach('perform 2nd DELETE request', function (done) {
      DocstoreClient.deleteDoc(this.project_id, this.doc_id, (error, res) => {
        this.res1 = res
        done(error)
      })
    })

    it('should reject the 2nd request', function () {
      expect(this.res1.statusCode).to.equal(400)
    })

    it('should not alter the previous doc state', function (done) {
      db.docs.find({ _id: this.doc_id }).toArray((error, docs) => {
        if (error) return done(error)
        const docAfter = docs[0]
        if (!docAfter) return done(new Error('doc not found'))

        expect(docAfter).to.deep.equal(this.docBefore)
        done()
      })
    })
  })

  describe('when providing a custom doc name in the delete request', function () {
    beforeEach(function (done) {
      DocstoreClient.deleteDocWithName(
        this.project_id,
        this.doc_id,
        'wombat.tex',
        done
      )
    })

    it('should insert the doc name into the docs collection', function (done) {
      db.docs.find({ _id: this.doc_id }).toArray((error, docs) => {
        if (error) return done(error)
        expect(docs[0].name).to.equal('wombat.tex')
        done()
      })
    })
  })

  describe('when providing a custom deletedAt date in the delete request', function () {
    beforeEach('record date and delay', function (done) {
      this.deletedAt = new Date()
      setTimeout(done, 5)
    })

    beforeEach('perform deletion with past date', function (done) {
      DocstoreClient.deleteDocWithDate(
        this.project_id,
        this.doc_id,
        this.deletedAt,
        done
      )
    })

    it('should insert the date into the docs collection', function (done) {
      db.docs.find({ _id: this.doc_id }).toArray((error, docs) => {
        if (error) return done(error)
        expect(docs[0].deletedAt.toISOString()).to.equal(
          this.deletedAt.toISOString()
        )
        done()
      })
    })
  })

  describe('when providing no doc name in the delete request', function () {
    beforeEach(function (done) {
      DocstoreClient.deleteDocWithName(
        this.project_id,
        this.doc_id,
        '',
        (error, res) => {
          this.res = res
          done(error)
        }
      )
    })

    it('should reject the request', function () {
      expect(this.res.statusCode).to.equal(400)
    })
  })

  describe('when providing no date in the delete request', function () {
    beforeEach(function (done) {
      DocstoreClient.deleteDocWithDate(
        this.project_id,
        this.doc_id,
        '',
        (error, res) => {
          this.res = res
          done(error)
        }
      )
    })

    it('should reject the request', function () {
      expect(this.res.statusCode).to.equal(400)
    })
  })
})

describe("Destroying a project's documents", function () {
  describe('when the doc exists', function () {
    beforeEach(function (done) {
      return db.docOps.insert(
        { doc_id: ObjectId(this.doc_id), version: 1 },
        function (err) {
          if (err != null) {
            return done(err)
          }
          return DocstoreClient.destroyAllDoc(this.project_id, done)
        }
      )
    })

    it('should remove the doc from the docs collection', function (done) {
      return db.docs.find({ _id: this.doc_id }).toArray((err, docs) => {
        expect(err).not.to.exist
        expect(docs).to.deep.equal([])
        return done()
      })
    })

    return it('should remove the docOps from the docOps collection', function (done) {
      return db.docOps.find({ doc_id: this.doc_id }).toArray((err, docOps) => {
        expect(err).not.to.exist
        expect(docOps).to.deep.equal([])
        return done()
      })
    })
  })

  return describe('when the doc is archived', function () {
    beforeEach(function (done) {
      return DocstoreClient.archiveAllDoc(this.project_id, (err) => {
        if (err != null) {
          return done(err)
        }
        return DocstoreClient.destroyAllDoc(this.project_id, done)
      })
    })

    it('should remove the doc from the docs collection', function (done) {
      return db.docs.find({ _id: this.doc_id }).toArray((err, docs) => {
        expect(err).not.to.exist
        expect(docs).to.deep.equal([])
        return done()
      })
    })

    it('should remove the docOps from the docOps collection', function (done) {
      return db.docOps.find({ doc_id: this.doc_id }).toArray((err, docOps) => {
        expect(err).not.to.exist
        expect(docOps).to.deep.equal([])
        return done()
      })
    })

    return it('should remove the doc contents from s3', function (done) {
      return DocstoreClient.getS3Doc(this.project_id, this.doc_id, (error) => {
        expect(error).to.be.instanceOf(Errors.NotFoundError)
        done()
      })
    })
  })
})
