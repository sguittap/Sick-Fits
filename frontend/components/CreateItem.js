import React, { Component } from 'react';
import {Mutation} from 'react-apollo';
import Form from './styles/Form';
import formatMoney from '../lib/formatMoney';
import gql from 'graphql-tag';
import Error from './ErrorMessage';
import Router from 'next/router';

const CREATE_ITEM_MUTATION =  gql`
    mutation  CREATE_ITEM_MUTATION(
        $title: String!
        $description: String!
        $price: Int!
        $image: String
        $largeImage: String
    ) {
        createItem(
            title: $title
            description: $description
            price: $price
            image: $image
            largeImage: $largeImage
        ) {
            id
        }
    }
`;


class CreateItem extends Component {
    state =  {
        title:'',
        description:'',
        image:'',
        largeImage:'',
        price: 0,
    };
    
    handleChange = (e) => {
        const {name, type, value} = e.target;
        const val = type === 'number' ? parseFloat(value) : value;
        this.setState({[name]: val})
    };

    upLoadFile = async e => {
        const files = e.target.files;
        const data = new FormData();
        data.append('file', files[0]);
        data.append('upload_preset', 'SickFits');
        const res = await fetch('https://api.cloudinary.com/v1_1/shaneguittap/image/upload', {
            method: 'POST',
            body: data
        });
        const file = await res.json();
        this.setState({
            image: file.secure_url,
            largeImage: file.eager[0].secure_url
        })
    }

    render() {
        return (
            <Mutation 
                mutation={CREATE_ITEM_MUTATION} 
                variables={this.state}>
                    {(createItem, {loading, error})=>(
                        <Form onSubmit={async e => {
                            e.preventDefault();
                            const res =  await createItem();
                            Router.push({
                                pathname:'/item',
                                query:{id: res.data.createItem.id},
                            })
                        }}>
                            <Error error={error}/>
                            <fieldset disabled={loading} aria-busy={loading}>
                                <label htmlFor="file">
                                    Image
                                    <input 
                                        type="file" 
                                        id="file" 
                                        name="file" 
                                        placeholder="Upload an Image" 
                                        required
                                        onChange={this.upLoadFile}>
                                    </input>
                                    {this.state.image && <img src={this.state.image} alt="Upload Preview"/>}
                                </label>
                                <label htmlFor="title">
                                    Title
                                    <input 
                                        type="text" 
                                        id="title" 
                                        name="title" 
                                        placeholder="Title" 
                                        required
                                        value={this.state.title}
                                        onChange={this.handleChange}>
                                    </input>
                                </label>
                            
                                <label htmlFor="price">
                                    Price
                                    <input 
                                        type="number" 
                                        id="price" 
                                        name="price" 
                                        placeholder="Price" 
                                        required
                                        value={this.state.price}
                                        onChange={this.handleChange}>
                                    </input>
                                </label>
                                
                                <label htmlFor="description">
                                    Description
                                    <textarea 
                                        id="description" 
                                        name="description" 
                                        placeholder="Enter a Description" 
                                        required
                                        value={this.state.description}
                                        onChange={this.handleChange}>
                                    </textarea>
                                </label>
                                <button type="submit">Submit</button>
                            </fieldset>
                        </Form>
                    )}
            </Mutation>
        )
    }
};

export default CreateItem;
export {CREATE_ITEM_MUTATION};